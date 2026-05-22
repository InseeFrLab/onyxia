import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
    type MouseEvent,
    type Dispatch,
    type MutableRefObject,
    type SetStateAction
} from "react";
import bytes from "bytes";
import LinearProgress from "@mui/material/LinearProgress";
import Checkbox from "@mui/material/Checkbox";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { alpha } from "@mui/material/styles";
import { assert } from "tsafe/assert";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { Dialog } from "onyxia-ui/Dialog";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { Tooltip } from "onyxia-ui/Tooltip";
import { getIconUrlByName } from "lazy-icons";
import { type S3Uri, stringifyS3Uri } from "core/tools/S3Uri";
import { S3SelectionActionBar } from "ui/shared/codex/S3SelectionActionBar";
import {
    S3DialogItemSummary,
    S3DialogTextInput,
    useS3DialogClasses
} from "ui/shared/codex/S3DialogPrimitives";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks/useEvt";
import { evtS3Uri_preSelected } from "./preSelectedS3Uri";

export type S3ExplorerMainViewProps = {
    className?: string;

    isListing: boolean;
    listedPrefix:
        | {
              isErrored: true;
              errorCase: "access denied" | "no such bucket";
          }
        | {
              isErrored: false;
              items: S3ExplorerMainViewProps.Item[];
          };

    onNavigate: (params: { s3Uri: S3Uri }) => void;

    onPutObjects: (params: {
        files: {
            relativePathSegments: string[];
            fileBasename: string;
            blob: Blob;
        }[];
    }) => void;

    onCreateDirectory: (params: { prefixSegment: string }) => void;

    onDelete: (params: { s3Uris: S3Uri[] }) => void;

    onDownload: (params: { s3Uri: S3Uri.NonTerminatedByDelimiter }) => void;

    onShareObject: (params: { s3Uri: S3Uri.NonTerminatedByDelimiter }) => void;

    onBookmark: (params: { s3Uri: S3Uri }) => void;

    onCopyS3Uri: (params: { s3Uri: S3Uri }) => void;

    bookmarkedS3Uris: S3Uri[];

    onChangePrefixPolicy: (params: {
        action: "make public" | "undo make public";
        s3Uri: S3Uri.TerminatedByDelimiter;
    }) => void;

    evtAction: NonPostableEvt<"CHOSE FILES TO UPLOAD">;

    isUploadDisabled: boolean;
};

export namespace S3ExplorerMainViewProps {
    export type Item = Item.PrefixSegment | Item.Object;

    export namespace Item {
        type Common = {
            uploadProgressPercent: number | undefined;
            isDeleting: boolean;
            displayName: string;
        };

        export type PrefixSegment = Common & {
            type: "prefix segment";
            s3Uri: S3Uri.TerminatedByDelimiter;
            policy: { isPublic: true } | { isPublic: false; canBeMadePublic: boolean };
        };

        export type Object = Common & {
            type: "object";
            s3Uri: S3Uri.NonTerminatedByDelimiter;
            size: number;
            lastModified: number;
        };
    }
}

type SortState = {
    key: "name" | "size" | "lastModified";
    direction: "asc" | "desc";
};

export type DeleteDialogState = {
    items: S3ExplorerMainViewProps.Item[];
};

type PrefixPolicyAction = Parameters<
    S3ExplorerMainViewProps["onChangePrefixPolicy"]
>[0]["action"];

type ObjectToUpload = Parameters<
    S3ExplorerMainViewProps["onPutObjects"]
>[0]["files"][number];

type DataTransferItemWithWebkitGetAsEntry = DataTransferItem & {
    webkitGetAsEntry?: () => FileSystemEntryLike | null;
};

type FileSystemEntryLike = {
    readonly isFile: boolean;
    readonly isDirectory: boolean;
    readonly name: string;
};

type FileSystemFileEntryLike = FileSystemEntryLike & {
    readonly isFile: true;
    readonly isDirectory: false;
    file: (
        successCallback: (file: File) => void,
        errorCallback?: (error: DOMException) => void
    ) => void;
};

type FileSystemDirectoryEntryLike = FileSystemEntryLike & {
    readonly isFile: false;
    readonly isDirectory: true;
    createReader: () => FileSystemDirectoryReaderLike;
};

type FileSystemDirectoryReaderLike = {
    readEntries: (
        successCallback: (entries: FileSystemEntryLike[]) => void,
        errorCallback?: (error: DOMException) => void
    ) => void;
};

function getItemKey(item: S3ExplorerMainViewProps.Item): string {
    return stringifyS3Uri(item.s3Uri);
}

function tryApplyPendingPreSelection(params: {
    isListing: boolean;
    listedPrefix: S3ExplorerMainViewProps["listedPrefix"];
    pendingPreSelectedS3UriRef: MutableRefObject<
        S3Uri.NonTerminatedByDelimiter | undefined
    >;
    lastSelectedItemKeyRef: MutableRefObject<string | undefined>;
    setSelectedItemKeys: Dispatch<SetStateAction<string[]>>;
}) {
    const {
        isListing,
        listedPrefix,
        pendingPreSelectedS3UriRef,
        lastSelectedItemKeyRef,
        setSelectedItemKeys
    } = params;

    if (listedPrefix.isErrored || isListing) {
        return;
    }

    const pendingPreSelectedS3Uri = pendingPreSelectedS3UriRef.current;

    if (pendingPreSelectedS3Uri === undefined) {
        return;
    }

    const preSelectedItemKey = stringifyS3Uri(pendingPreSelectedS3Uri);
    const hasMatchingItem = listedPrefix.items.some(
        item =>
            item.type === "object" &&
            !item.isDeleting &&
            getItemKey(item) === preSelectedItemKey
    );

    if (!hasMatchingItem) {
        return;
    }

    setSelectedItemKeys([preSelectedItemKey]);
    lastSelectedItemKeyRef.current = preSelectedItemKey;
    pendingPreSelectedS3UriRef.current = undefined;
}

function getObjectsToUploadFromFiles(files: readonly File[]): ObjectToUpload[] {
    return files.map(file => {
        const relativePathSegments = file.webkitRelativePath
            .split("/")
            .filter(Boolean)
            .slice(0, -1);

        return {
            relativePathSegments,
            fileBasename: file.name,
            blob: file as Blob
        };
    });
}

function getFileSystemEntry(item: DataTransferItem): FileSystemEntryLike | null {
    return (item as DataTransferItemWithWebkitGetAsEntry).webkitGetAsEntry?.() ?? null;
}

function getHasDraggedFiles(dataTransfer: DataTransfer): boolean {
    if (dataTransfer.items.length !== 0) {
        return Array.from(dataTransfer.items).some(item => item.kind === "file");
    }

    return dataTransfer.types.includes("Files");
}

function readFileEntry(entry: FileSystemFileEntryLike): Promise<File> {
    return new Promise((resolve, reject) => entry.file(resolve, error => reject(error)));
}

function readDirectoryEntries(
    entry: FileSystemDirectoryEntryLike
): Promise<FileSystemEntryLike[]> {
    const reader = entry.createReader();
    const entries: FileSystemEntryLike[] = [];

    return new Promise((resolve, reject) => {
        const readNextBatch = () => {
            reader.readEntries(
                batch => {
                    if (batch.length === 0) {
                        resolve(entries);
                        return;
                    }

                    entries.push(...batch);
                    readNextBatch();
                },
                error => reject(error)
            );
        };

        readNextBatch();
    });
}

async function getObjectsToUploadFromFileSystemEntry(params: {
    entry: FileSystemEntryLike;
    relativePathSegments: string[];
}): Promise<ObjectToUpload[]> {
    const { entry, relativePathSegments } = params;

    if (entry.isFile) {
        const file = await readFileEntry(entry as FileSystemFileEntryLike);

        return [
            {
                relativePathSegments: [...relativePathSegments],
                fileBasename: file.name,
                blob: file
            }
        ];
    }

    const directoryEntry = entry as FileSystemDirectoryEntryLike;
    const childEntries = await readDirectoryEntries(directoryEntry);
    const childRelativePathSegments = [...relativePathSegments, directoryEntry.name];

    return (
        await Promise.all(
            childEntries.map(childEntry =>
                getObjectsToUploadFromFileSystemEntry({
                    entry: childEntry,
                    relativePathSegments: childRelativePathSegments
                })
            )
        )
    ).flat();
}

async function getObjectsToUploadFromDroppedItems(params: {
    items: readonly DataTransferItem[];
    files: readonly File[];
}): Promise<ObjectToUpload[]> {
    const { items, files } = params;
    const fileItems = items.filter(
        (item): item is DataTransferItem => item.kind === "file"
    );
    const itemsWithEntries = fileItems.map(item => ({
        item,
        entry: getFileSystemEntry(item)
    }));
    const hasFileSystemEntrySupport = itemsWithEntries.some(
        ({ entry }) => entry !== null
    );

    const droppedObjects = (
        await Promise.all(
            itemsWithEntries.map(async ({ item, entry }) => {
                if (entry !== null) {
                    return getObjectsToUploadFromFileSystemEntry({
                        entry,
                        relativePathSegments: []
                    });
                }

                const file = item.getAsFile();

                if (file === null) {
                    return [];
                }

                return getObjectsToUploadFromFiles([file]);
            })
        )
    ).flat();

    if (hasFileSystemEntrySupport) {
        return droppedObjects;
    }

    return getObjectsToUploadFromFiles(files);
}

function getFormattedSize(size: number): string {
    return bytes(size) ?? `${size}B`;
}

function getDayStamp(date: Date): number {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function getFormattedLastModified(params: { time: number }): string {
    const { time } = params;

    const date = new Date(time);
    const today = new Date();
    const diffDays = Math.floor(
        (getDayStamp(today) - getDayStamp(date)) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 0) {
        return "Today";
    }

    if (diffDays === 1) {
        return "Yesterday";
    }

    return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

function getProgressPercent(item: S3ExplorerMainViewProps.Item): number | undefined {
    if (item.uploadProgressPercent === undefined) {
        return undefined;
    }

    if (!Number.isFinite(item.uploadProgressPercent)) {
        return undefined;
    }

    return Math.max(0, Math.min(100, item.uploadProgressPercent));
}

function getIsItemActionAvailable(item: S3ExplorerMainViewProps.Item): boolean {
    if (item.isDeleting) {
        return false;
    }

    const progressPercent = getProgressPercent(item);

    return progressPercent === undefined || progressPercent === 100;
}

function getPrefixPolicyAction(
    item: S3ExplorerMainViewProps.Item
): PrefixPolicyAction | undefined {
    if (item.type !== "prefix segment") {
        return undefined;
    }

    if (item.policy.isPublic) {
        return "undo make public";
    }

    if (item.policy.canBeMadePublic) {
        return "make public";
    }

    return undefined;
}

function getPrefixPolicyActionLabel(
    action: PrefixPolicyAction,
    t: ReturnType<typeof useTranslation>["t"]
): string {
    return action === "make public" ? t("make public") : t("make private");
}

function getPrefixPolicyActionIconName(
    action: PrefixPolicyAction
): "Public" | "PublicOff" {
    return action === "make public" ? "Public" : "PublicOff";
}

function getSortedItems(params: {
    items: S3ExplorerMainViewProps.Item[];
    sortState: SortState;
}): S3ExplorerMainViewProps.Item[] {
    const { items, sortState } = params;

    return [...items].sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === "prefix segment" ? -1 : 1;
        }

        if (a.type === "prefix segment" && b.type === "prefix segment") {
            return a.displayName.localeCompare(b.displayName);
        }

        assert(a.type === "object");
        assert(b.type === "object");

        const directionMultiplier = sortState.direction === "asc" ? 1 : -1;

        let comparison = 0;

        switch (sortState.key) {
            case "name":
                comparison = a.displayName.localeCompare(b.displayName);
                break;
            case "size":
                comparison = a.size - b.size;
                break;
            case "lastModified":
                comparison = a.lastModified - b.lastModified;
                break;
        }

        if (comparison === 0) {
            comparison = a.displayName.localeCompare(b.displayName);
        }

        return comparison * directionMultiplier;
    });
}

function getSortIndicatorProps(params: { sortState: SortState; key: SortState["key"] }) {
    const { sortState, key } = params;

    const isActive = sortState.key === key;

    return {
        isActive,
        ariaSort: isActive
            ? sortState.direction === "asc"
                ? "ascending"
                : "descending"
            : "none",
        icon: getIconUrlByName(
            !isActive
                ? "UnfoldMore"
                : sortState.direction === "asc"
                  ? "ArrowUpward"
                  : "ArrowDownward"
        )
    } as const;
}

function CreateDirectoryDialog(props: {
    open: boolean;
    onClose: () => void;
    onSubmit: (params: { prefixSegment: string }) => void;
}) {
    const { open, onClose, onSubmit } = props;
    const { t } = useTranslation({ S3ExplorerMainView });

    const [draft, setDraft] = useState("");
    const [isDraftValid, setIsDraftValid] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setDraft("");
        setIsDraftValid(false);
    }, [open]);

    const submit = () => {
        const trimmedDraft = draft.trim();

        if (trimmedDraft === "") {
            return;
        }

        onSubmit({
            prefixSegment: trimmedDraft
        });
    };

    return (
        <Dialog
            isOpen={open}
            onClose={onClose}
            title={t("create prefix dialog title")}
            subtitle={t("create prefix dialog subtitle")}
            body={
                open && (
                    <S3DialogTextInput
                        autoFocus={true}
                        label={t("prefix name field label")}
                        value={draft}
                        error={
                            !isDraftValid && draft !== ""
                                ? t("prefix name empty error")
                                : undefined
                        }
                        onChange={value => {
                            setDraft(value);
                            setIsDraftValid(value.trim() !== "");
                        }}
                        onEnterKeyDown={() => {
                            if (isDraftValid) {
                                submit();
                            }
                        }}
                    />
                )
            }
            buttons={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button
                        disabled={!isDraftValid}
                        onClick={isDraftValid ? submit : undefined}
                    >
                        {t("create prefix")}
                    </Button>
                </>
            }
        />
    );
}

export function DeleteSelectionDialog(props: {
    state: DeleteDialogState | undefined;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const { state, onClose, onConfirm } = props;
    const { t } = useTranslation({ S3ExplorerMainView });
    const dialogClasses = useS3DialogClasses();
    const { classes } = useStyles_DeleteSelectionDialog();

    return (
        <Dialog
            isOpen={state !== undefined}
            onClose={onClose}
            className={dialogClasses.paper}
            maxWidth={false}
            muiDialogClasses={{ root: dialogClasses.overlayRoot }}
            title={t("delete selection dialog title")}
            subtitle={t("delete selection dialog subtitle")}
            classes={{
                title: dialogClasses.title,
                subtitle: dialogClasses.subtitle,
                body: dialogClasses.body,
                buttons: dialogClasses.buttons
            }}
            body={
                state !== undefined && (
                    <div className={classes.body}>
                        <div className={classes.description}>
                            {t("delete selection dialog body", {
                                count: state.items.length
                            })}
                        </div>
                        <div className={classes.itemList}>
                            {state.items.map(item => (
                                <S3DialogItemSummary
                                    key={getItemKey(item)}
                                    name={`${item.displayName}${
                                        item.type === "prefix segment" ? "/" : ""
                                    }`}
                                    icon={
                                        item.type === "prefix segment"
                                            ? "folder"
                                            : "object"
                                    }
                                    isPublic={
                                        item.type === "prefix segment" &&
                                        item.policy.isPublic
                                    }
                                />
                            ))}
                        </div>
                    </div>
                )
            }
            buttons={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button startIcon={getIconUrlByName("Delete")} onClick={onConfirm}>
                        {t("delete")}
                    </Button>
                </>
            }
        />
    );
}

function ErrorState(props: {
    errorCase: Extract<
        S3ExplorerMainViewProps["listedPrefix"],
        { isErrored: true }
    >["errorCase"];
}) {
    const { errorCase } = props;
    const { classes } = useStyles({
        isDragActive: false
    });

    return (
        <div className={classes.errorState}>
            <div className={classes.errorIcon}>
                <Icon icon={getIconUrlByName("ErrorOutline")} size="large" />
            </div>
            <div className={classes.errorTitle}>
                {errorCase === "access denied" ? "Access denied" : "Bucket not found"}
            </div>
            <div className={classes.errorDescription}>
                {errorCase === "access denied"
                    ? "You do not have permission to list this S3 location."
                    : "The requested bucket does not exist or is not reachable with the current profile."}
            </div>
        </div>
    );
}

const useStyles_DeleteSelectionDialog = tss
    .withName({ DeleteSelectionDialog })
    .create(({ theme }) => ({
        body: {
            minWidth: 520,
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(3),
            color: theme.colors.useCases.typography.textPrimary
        },
        description: {
            lineHeight: 1.5
        },
        itemList: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2),
            maxHeight: 240,
            overflow: "auto",
            minWidth: 0
        }
    }));

type ItemRowProps = {
    item: S3ExplorerMainViewProps.Item;
    isSelected: boolean;
    isBookmarked: boolean;
    isStriped: boolean;
    showRowActions: boolean;
    onRowClick: (event: MouseEvent<HTMLTableRowElement>) => void;
    onNavigate: () => void;
    onDelete: () => void;
    onShareObject: (() => void) | undefined;
    onChangePrefixPolicy: (() => void) | undefined;
    onDownload: (() => void) | undefined;
    onBookmark: (() => void) | undefined;
    onCopyS3Uri: () => void;
    onCheckboxChange: () => void;
};

function ItemRow(props: ItemRowProps) {
    const {
        item,
        isSelected,
        isBookmarked,
        isStriped,
        showRowActions,
        onRowClick,
        onNavigate,
        onDelete,
        onShareObject,
        onChangePrefixPolicy,
        onDownload,
        onBookmark,
        onCopyS3Uri,
        onCheckboxChange
    } = props;

    const progressPercent = getProgressPercent(item);
    const isUploadInProgress =
        progressPercent !== undefined && progressPercent < 100 && !item.isDeleting;
    const canNavigate =
        !item.isDeleting && !(item.type === "object" && isUploadInProgress);
    const isItemActionAvailable = getIsItemActionAvailable(item);
    const isDownloadAvailable = onDownload !== undefined && isItemActionAvailable;
    const isShareAvailable = onShareObject !== undefined && isItemActionAvailable;
    const prefixPolicyAction = getPrefixPolicyAction(item);
    const isPrefixPolicyActionAvailable =
        onChangePrefixPolicy !== undefined && isItemActionAvailable;
    const isCopyAvailable = !item.isDeleting;
    const { t } = useTranslation({ S3ExplorerMainView });
    const itemKindLabelCapitalized =
        item.type === "prefix segment" ? t("folder") : t("object");
    const itemIconLabel =
        item.type === "prefix segment"
            ? item.policy.isPublic
                ? t("folder is public")
                : t("folder is private")
            : itemKindLabelCapitalized;

    const { classes, cx } = useStyles({
        isDragActive: false
    });

    return (
        <tr
            className={cx(
                classes.tableRow,
                isStriped && classes.tableRowStriped,
                isSelected && classes.tableRowSelected,
                item.isDeleting && classes.tableRowBusy
            )}
            onClick={onRowClick}
            onDoubleClick={() => {
                if (canNavigate) {
                    onNavigate();
                }
            }}
        >
            <td className={classes.checkboxCell}>
                <Checkbox
                    checked={isSelected}
                    disabled={item.isDeleting}
                    onClick={event => {
                        event.stopPropagation();
                    }}
                    onChange={event => {
                        event.stopPropagation();
                        onCheckboxChange();
                    }}
                    inputProps={{
                        "aria-label": `Select ${item.displayName}`
                    }}
                />
            </td>
            <td className={classes.nameCell}>
                <div className={classes.nameCellContent}>
                    <div className={classes.itemIdentity}>
                        <Tooltip title={itemIconLabel}>
                            <div
                                className={classes.itemIconWrapper}
                                role="img"
                                aria-label={itemIconLabel}
                            >
                                <Icon
                                    icon={getIconUrlByName(
                                        item.type === "prefix segment"
                                            ? "Folder"
                                            : "Description"
                                    )}
                                    size="small"
                                />
                            </div>
                        </Tooltip>
                        <div className={classes.itemNameBlock}>
                            <div className={classes.itemPrimaryRow}>
                                <button
                                    type="button"
                                    className={classes.itemNameButton}
                                    title={
                                        item.type === "prefix segment"
                                            ? `${item.displayName}/`
                                            : item.displayName
                                    }
                                    disabled={!canNavigate}
                                    onClick={event => {
                                        event.stopPropagation();
                                        onNavigate();
                                    }}
                                >
                                    {item.displayName}
                                </button>

                                {item.type === "prefix segment" &&
                                    item.policy.isPublic && (
                                        <span className={classes.itemPublicTag}>
                                            <Icon
                                                icon={getIconUrlByName("Public")}
                                                size="extra small"
                                            />
                                            Public
                                        </span>
                                    )}

                                {(item.isDeleting ||
                                    isUploadInProgress ||
                                    progressPercent === 100) && (
                                    <div className={classes.itemMetaRow}>
                                        {item.isDeleting && (
                                            <span
                                                className={cx(
                                                    classes.statusPill,
                                                    classes.statusPillWarning
                                                )}
                                            >
                                                Deleting...
                                            </span>
                                        )}
                                        {!item.isDeleting && isUploadInProgress && (
                                            <>
                                                <span
                                                    className={cx(
                                                        classes.statusPill,
                                                        classes.statusPillUploading
                                                    )}
                                                >
                                                    <span
                                                        className={
                                                            classes.statusPillLabel
                                                        }
                                                    >
                                                        Uploading
                                                    </span>
                                                    <span
                                                        className={
                                                            classes.statusPillPercent
                                                        }
                                                    >
                                                        {Math.round(progressPercent)}%
                                                    </span>
                                                </span>
                                                <div
                                                    className={
                                                        classes.inlineProgressTrack
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            classes.inlineProgressFill
                                                        }
                                                        style={{
                                                            width: `${progressPercent}%`
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        {!item.isDeleting &&
                                            !isUploadInProgress &&
                                            progressPercent === 100 && (
                                                <span className={classes.statusPill}>
                                                    {t("uploaded")}
                                                </span>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={classes.rowActions}>
                        {showRowActions && (
                            <>
                                {onShareObject !== undefined && (
                                    <Tooltip title={t("share")}>
                                        <span className={classes.inlineActionWrapper}>
                                            <IconButton
                                                className={classes.rowActionButton}
                                                icon={getIconUrlByName("Share")}
                                                aria-label={t("share")}
                                                disabled={!isShareAvailable}
                                                onClick={event => {
                                                    event.stopPropagation();

                                                    if (
                                                        !isShareAvailable ||
                                                        onShareObject === undefined
                                                    ) {
                                                        return;
                                                    }

                                                    onShareObject();
                                                }}
                                            />
                                        </span>
                                    </Tooltip>
                                )}
                                {prefixPolicyAction !== undefined &&
                                    onChangePrefixPolicy !== undefined && (
                                        <Tooltip
                                            title={getPrefixPolicyActionLabel(
                                                prefixPolicyAction,
                                                t
                                            )}
                                        >
                                            <span className={classes.inlineActionWrapper}>
                                                <IconButton
                                                    className={classes.rowActionButton}
                                                    icon={getIconUrlByName(
                                                        getPrefixPolicyActionIconName(
                                                            prefixPolicyAction
                                                        )
                                                    )}
                                                    aria-label={getPrefixPolicyActionLabel(
                                                        prefixPolicyAction,
                                                        t
                                                    )}
                                                    disabled={
                                                        !isPrefixPolicyActionAvailable
                                                    }
                                                    onClick={event => {
                                                        event.stopPropagation();

                                                        if (
                                                            !isPrefixPolicyActionAvailable ||
                                                            onChangePrefixPolicy ===
                                                                undefined
                                                        ) {
                                                            return;
                                                        }

                                                        onChangePrefixPolicy();
                                                    }}
                                                />
                                            </span>
                                        </Tooltip>
                                    )}
                                {onDownload !== undefined && (
                                    <Tooltip title={t("download")}>
                                        <span className={classes.inlineActionWrapper}>
                                            <IconButton
                                                className={classes.rowActionButton}
                                                icon={getIconUrlByName("FileDownload")}
                                                aria-label={t("download")}
                                                disabled={!isDownloadAvailable}
                                                onClick={event => {
                                                    event.stopPropagation();

                                                    if (
                                                        !isDownloadAvailable ||
                                                        onDownload === undefined
                                                    ) {
                                                        return;
                                                    }

                                                    onDownload();
                                                }}
                                            />
                                        </span>
                                    </Tooltip>
                                )}
                                {onBookmark !== undefined && (
                                    <Tooltip
                                        title={
                                            isBookmarked
                                                ? t("delete from bookmarks")
                                                : t("add to bookmarks")
                                        }
                                    >
                                        <span className={classes.inlineActionWrapper}>
                                            <button
                                                type="button"
                                                className={cx(
                                                    classes.rowActionButton,
                                                    isBookmarked &&
                                                        classes.rowActionButtonActive
                                                )}
                                                aria-label={
                                                    isBookmarked
                                                        ? t("delete from bookmarks")
                                                        : t("add to bookmarks")
                                                }
                                                disabled={!isItemActionAvailable}
                                                onClick={event => {
                                                    event.stopPropagation();

                                                    if (!isItemActionAvailable) {
                                                        return;
                                                    }

                                                    onBookmark();
                                                }}
                                            >
                                                {isBookmarked ? (
                                                    <StarIcon fontSize="small" />
                                                ) : (
                                                    <StarBorderIcon fontSize="small" />
                                                )}
                                            </button>
                                        </span>
                                    </Tooltip>
                                )}
                                <Tooltip title={t("copy s3 path")}>
                                    <span className={classes.inlineActionWrapper}>
                                        <IconButton
                                            className={classes.rowActionButton}
                                            icon={getIconUrlByName("ContentCopy")}
                                            aria-label={t("copy s3 path")}
                                            disabled={!isCopyAvailable}
                                            onClick={event => {
                                                event.stopPropagation();

                                                if (!isCopyAvailable) {
                                                    return;
                                                }

                                                onCopyS3Uri();
                                            }}
                                        />
                                    </span>
                                </Tooltip>
                                <Tooltip title={t("delete")}>
                                    <span className={classes.inlineActionWrapper}>
                                        <IconButton
                                            className={classes.rowActionButton}
                                            icon={getIconUrlByName("Delete")}
                                            aria-label={t("delete")}
                                            disabled={item.isDeleting}
                                            onClick={event => {
                                                event.stopPropagation();
                                                onDelete();
                                            }}
                                        />
                                    </span>
                                </Tooltip>
                            </>
                        )}
                    </div>
                </div>
            </td>
            <td className={classes.metaCell}>
                {item.type === "object"
                    ? getFormattedLastModified({ time: item.lastModified })
                    : "\u00A0"}
            </td>
            <td className={cx(classes.metaCell, classes.sizeCell)}>
                {item.type === "object" ? getFormattedSize(item.size) : "Folder"}
            </td>
        </tr>
    );
}

export function S3ExplorerMainView(props: S3ExplorerMainViewProps) {
    const {
        className,
        isListing,
        listedPrefix,
        onNavigate,
        onPutObjects,
        onCreateDirectory,
        onDelete,
        onDownload,
        onShareObject,
        onBookmark,
        onCopyS3Uri,
        bookmarkedS3Uris,
        onChangePrefixPolicy,
        evtAction,
        isUploadDisabled
    } = props;

    const [sortState, setSortState] = useState<SortState>({
        key: "name",
        direction: "asc"
    });
    const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
    const [isCreateDirectoryDialogOpen, setIsCreateDirectoryDialogOpen] = useState(false);
    const [deleteDialogState, setDeleteDialogState] = useState<
        DeleteDialogState | undefined
    >(undefined);
    const [isDragActive, setIsDragActive] = useState(false);

    const lastSelectedItemKeyRef = useRef<string | undefined>(undefined);
    const pendingPreSelectedS3UriRef = useRef<S3Uri.NonTerminatedByDelimiter | undefined>(
        undefined
    );
    const dragDepthRef = useRef(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { classes, cx } = useStyles({ isDragActive });
    const { t } = useTranslation({ S3ExplorerMainView });

    const openFilePicker = () => {
        const input = fileInputRef.current;

        if (input === null) {
            return;
        }

        input.value = "";

        if (typeof input.showPicker === "function") {
            input.showPicker();
            return;
        }

        input.click();
    };

    useEvt(
        ctx =>
            evtAction.pipe(ctx).attach(
                action => action === "CHOSE FILES TO UPLOAD",
                () => {
                    openFilePicker();
                }
            ),
        [evtAction]
    );

    useEffect(() => {
        if (listedPrefix.isErrored) {
            setSelectedItemKeys([]);
            lastSelectedItemKeyRef.current = undefined;
            return;
        }

        const availableItemKeys = new Set(
            listedPrefix.items
                .filter(item => !item.isDeleting)
                .map(item => getItemKey(item))
        );

        setSelectedItemKeys(previouslySelectedItemKeys =>
            previouslySelectedItemKeys.filter(itemKey => availableItemKeys.has(itemKey))
        );

        if (
            lastSelectedItemKeyRef.current !== undefined &&
            !availableItemKeys.has(lastSelectedItemKeyRef.current)
        ) {
            lastSelectedItemKeyRef.current = undefined;
        }
    }, [listedPrefix]);

    useEvt(
        ctx =>
            evtS3Uri_preSelected.attach(ctx, s3Uri => {
                if (s3Uri === undefined) {
                    return;
                }

                pendingPreSelectedS3UriRef.current = s3Uri;
                evtS3Uri_preSelected.state = undefined;

                tryApplyPendingPreSelection({
                    isListing,
                    listedPrefix,
                    pendingPreSelectedS3UriRef,
                    lastSelectedItemKeyRef,
                    setSelectedItemKeys
                });
            }),
        [isListing, listedPrefix]
    );

    useEffect(() => {
        tryApplyPendingPreSelection({
            isListing,
            listedPrefix,
            pendingPreSelectedS3UriRef,
            lastSelectedItemKeyRef,
            setSelectedItemKeys
        });
    }, [isListing, listedPrefix]);

    useEffect(() => {
        if (!isUploadDisabled) {
            return;
        }

        dragDepthRef.current = 0;
        setIsDragActive(false);
    }, [isUploadDisabled]);

    const items = listedPrefix.isErrored
        ? []
        : getSortedItems({
              items: listedPrefix.items,
              sortState
          });

    const selectableItems = items.filter(item => !item.isDeleting);
    const selectedItemKeySet = new Set(selectedItemKeys);
    const bookmarkedItemKeySet = new Set(bookmarkedS3Uris.map(stringifyS3Uri));
    const selectedItems = items.filter(item => selectedItemKeySet.has(getItemKey(item)));
    const showRowActions = selectedItems.length <= 1;

    const isAllSelected =
        selectableItems.length > 0 &&
        selectableItems.every(item => selectedItemKeySet.has(getItemKey(item)));
    const isSelectionIndeterminate =
        !isAllSelected && selectedItems.length > 0 && selectableItems.length > 0;

    const selectedItemForSingleItemAction =
        selectedItems.length === 1 ? selectedItems[0] : undefined;
    const selectedObjectForSingleItemAction =
        selectedItemForSingleItemAction?.type === "object"
            ? selectedItemForSingleItemAction
            : undefined;
    const selectedPrefixForSingleItemAction =
        selectedItemForSingleItemAction?.type === "prefix segment"
            ? selectedItemForSingleItemAction
            : undefined;
    const selectedPrefixPolicyAction =
        selectedPrefixForSingleItemAction !== undefined &&
        getIsItemActionAvailable(selectedPrefixForSingleItemAction)
            ? getPrefixPolicyAction(selectedPrefixForSingleItemAction)
            : undefined;

    const setSelectionToSingleItem = (itemKey: string) => {
        setSelectedItemKeys([itemKey]);
        lastSelectedItemKeyRef.current = itemKey;
    };

    const toggleSelectionForItem = (itemKey: string) => {
        setSelectedItemKeys(previouslySelectedItemKeys => {
            const nextSelectedItemKeys = previouslySelectedItemKeys.includes(itemKey)
                ? previouslySelectedItemKeys.filter(
                      selectedItemKey => selectedItemKey !== itemKey
                  )
                : [...previouslySelectedItemKeys, itemKey];

            return nextSelectedItemKeys;
        });

        lastSelectedItemKeyRef.current = itemKey;
    };

    const selectItemRange = (itemKey: string) => {
        const selectableItemKeys = selectableItems.map(item => getItemKey(item));
        const anchorItemKey = lastSelectedItemKeyRef.current;

        if (anchorItemKey === undefined) {
            setSelectionToSingleItem(itemKey);
            return;
        }

        const anchorIndex = selectableItemKeys.indexOf(anchorItemKey);
        const targetIndex = selectableItemKeys.indexOf(itemKey);

        if (anchorIndex === -1 || targetIndex === -1) {
            setSelectionToSingleItem(itemKey);
            return;
        }

        const [startIndex, endIndex] =
            anchorIndex <= targetIndex
                ? [anchorIndex, targetIndex]
                : [targetIndex, anchorIndex];

        setSelectedItemKeys(selectableItemKeys.slice(startIndex, endIndex + 1));
    };

    const handleRowSelection = (params: {
        item: S3ExplorerMainViewProps.Item;
        event: MouseEvent<HTMLTableRowElement>;
    }) => {
        const { item, event } = params;

        if (item.isDeleting) {
            return;
        }

        const itemKey = getItemKey(item);

        if (event.shiftKey) {
            selectItemRange(itemKey);
            return;
        }

        if (event.metaKey || event.ctrlKey) {
            toggleSelectionForItem(itemKey);
            return;
        }

        setSelectionToSingleItem(itemKey);
    };

    const handleSortToggle = (key: SortState["key"]) => {
        setSortState(previousSortState => {
            if (previousSortState.key === key) {
                return {
                    ...previousSortState,
                    direction: previousSortState.direction === "asc" ? "desc" : "asc"
                };
            }

            return {
                key,
                direction: key === "name" ? "asc" : "desc"
            };
        });
    };

    const handleUploadFiles = (files: readonly File[]) => {
        if (files.length === 0) {
            return;
        }

        onPutObjects({
            files: getObjectsToUploadFromFiles(files)
        });
    };

    const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
        if (!getHasDraggedFiles(event.dataTransfer)) {
            return;
        }

        event.preventDefault();
        dragDepthRef.current = 0;
        setIsDragActive(false);

        if (isUploadDisabled) {
            return;
        }

        const items = Array.from(event.dataTransfer.items);
        const files = Array.from(event.dataTransfer.files);

        const objectsToUpload = await getObjectsToUploadFromDroppedItems({
            items,
            files
        });

        if (objectsToUpload.length === 0) {
            return;
        }

        onPutObjects({
            files: objectsToUpload
        });
    };

    const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);

        handleUploadFiles(files);

        event.target.value = "";
    };

    const requestShareForObject = (item: S3ExplorerMainViewProps.Item.Object) => {
        if (!getIsItemActionAvailable(item)) {
            return;
        }

        onShareObject({
            s3Uri: item.s3Uri
        });
    };

    const requestPrefixPolicyChangeForItem = (
        item: S3ExplorerMainViewProps.Item.PrefixSegment
    ) => {
        if (!getIsItemActionAvailable(item)) {
            return;
        }

        const action = getPrefixPolicyAction(item);

        if (action === undefined) {
            return;
        }

        onChangePrefixPolicy({
            action,
            s3Uri: item.s3Uri
        });
    };

    const requestDownloadForItems = (itemsToDownload: S3ExplorerMainViewProps.Item[]) => {
        const downloadableObjects = itemsToDownload.filter(
            (item): item is S3ExplorerMainViewProps.Item.Object => {
                if (item.type !== "object") {
                    return false;
                }

                if (item.isDeleting) {
                    return false;
                }

                const progressPercent = getProgressPercent(item);

                return progressPercent === undefined || progressPercent === 100;
            }
        );

        if (downloadableObjects.length === 0) {
            return;
        }

        downloadableObjects.forEach(item => onDownload({ s3Uri: item.s3Uri }));
    };

    const requestDeletionForItems = (itemsToDelete: S3ExplorerMainViewProps.Item[]) => {
        if (itemsToDelete.length === 0) {
            return;
        }

        setDeleteDialogState({
            items: itemsToDelete
        });
    };

    const requestBookmarkForItem = (item: S3ExplorerMainViewProps.Item) => {
        if (!getIsItemActionAvailable(item)) {
            return;
        }

        onBookmark({
            s3Uri: item.s3Uri
        });
    };

    const clearSelection = () => {
        setSelectedItemKeys([]);
        lastSelectedItemKeyRef.current = undefined;
    };

    const copySelectedS3Uri = () => {
        if (selectedItems.length !== 1) {
            return;
        }

        const selectedItem = selectedItems[0];

        onCopyS3Uri({
            s3Uri: selectedItem.s3Uri
        });
    };

    const copyItemS3Uri = (item: S3ExplorerMainViewProps.Item) => {
        onCopyS3Uri({
            s3Uri: item.s3Uri
        });
    };

    const handleNavigate = (s3Uri: S3Uri) => {
        clearSelection();
        onNavigate({ s3Uri });
    };

    const nameSortIndicator = getSortIndicatorProps({
        sortState,
        key: "name"
    });

    const sizeSortIndicator = getSortIndicatorProps({
        sortState,
        key: "size"
    });

    const lastModifiedSortIndicator = getSortIndicatorProps({
        sortState,
        key: "lastModified"
    });

    if (listedPrefix.isErrored) {
        return (
            <div className={cx(classes.root, className)}>
                <div className={classes.surface}>
                    <ErrorState errorCase={listedPrefix.errorCase} />
                </div>
            </div>
        );
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                hidden={true}
                multiple={true}
                onChange={handleFileInputChange}
            />

            <CreateDirectoryDialog
                open={isCreateDirectoryDialogOpen}
                onClose={() => setIsCreateDirectoryDialogOpen(false)}
                onSubmit={({ prefixSegment }) => {
                    setIsCreateDirectoryDialogOpen(false);
                    onCreateDirectory({ prefixSegment });
                }}
            />

            <DeleteSelectionDialog
                state={deleteDialogState}
                onClose={() => setDeleteDialogState(undefined)}
                onConfirm={() => {
                    assert(deleteDialogState !== undefined);

                    onDelete({
                        s3Uris: deleteDialogState.items.map(item => item.s3Uri)
                    });

                    setDeleteDialogState(undefined);
                    clearSelection();
                }}
            />

            <div className={cx(classes.root, className)} aria-busy={isListing}>
                <div className={classes.selectionBarSlot}>
                    {selectedItems.length > 0 && (
                        <S3SelectionActionBar
                            selectionCount={selectedItems.length}
                            onClear={clearSelection}
                            onDownload={
                                selectedObjectForSingleItemAction === undefined ||
                                !getIsItemActionAvailable(
                                    selectedObjectForSingleItemAction
                                )
                                    ? undefined
                                    : () =>
                                          requestDownloadForItems([
                                              selectedObjectForSingleItemAction
                                          ])
                            }
                            onDelete={() => requestDeletionForItems(selectedItems)}
                            onCopyS3Uri={
                                selectedItemForSingleItemAction === undefined
                                    ? undefined
                                    : copySelectedS3Uri
                            }
                            onBookmark={
                                selectedItemForSingleItemAction === undefined ||
                                !getIsItemActionAvailable(selectedItemForSingleItemAction)
                                    ? undefined
                                    : () =>
                                          requestBookmarkForItem(
                                              selectedItemForSingleItemAction
                                          )
                            }
                            bookmarkLabel={
                                selectedItemForSingleItemAction !== undefined &&
                                bookmarkedItemKeySet.has(
                                    stringifyS3Uri(selectedItemForSingleItemAction.s3Uri)
                                )
                                    ? t("delete from bookmarks")
                                    : t("add to bookmarks")
                            }
                            onShare={
                                selectedObjectForSingleItemAction === undefined ||
                                !getIsItemActionAvailable(
                                    selectedObjectForSingleItemAction
                                )
                                    ? undefined
                                    : () =>
                                          requestShareForObject(
                                              selectedObjectForSingleItemAction
                                          )
                            }
                            onMakePublic={
                                selectedPrefixForSingleItemAction === undefined ||
                                selectedPrefixPolicyAction !== "make public"
                                    ? undefined
                                    : () =>
                                          requestPrefixPolicyChangeForItem(
                                              selectedPrefixForSingleItemAction
                                          )
                            }
                            onMakePrivate={
                                selectedPrefixForSingleItemAction === undefined ||
                                selectedPrefixPolicyAction !== "undo make public"
                                    ? undefined
                                    : () =>
                                          requestPrefixPolicyChangeForItem(
                                              selectedPrefixForSingleItemAction
                                          )
                            }
                        />
                    )}
                </div>

                <div
                    className={classes.surface}
                    onDragEnter={(event: DragEvent<HTMLDivElement>) => {
                        if (!getHasDraggedFiles(event.dataTransfer)) {
                            return;
                        }

                        event.preventDefault();

                        if (isUploadDisabled) {
                            dragDepthRef.current = 0;
                            setIsDragActive(false);
                            return;
                        }

                        dragDepthRef.current += 1;
                        setIsDragActive(true);
                    }}
                    onDragOver={(event: DragEvent<HTMLDivElement>) => {
                        if (!getHasDraggedFiles(event.dataTransfer)) {
                            return;
                        }

                        event.preventDefault();

                        if (isUploadDisabled) {
                            dragDepthRef.current = 0;
                            event.dataTransfer.dropEffect = "none";
                            setIsDragActive(false);
                            return;
                        }

                        event.dataTransfer.dropEffect = "copy";
                        setIsDragActive(true);
                    }}
                    onDragLeave={(event: DragEvent<HTMLDivElement>) => {
                        if (!getHasDraggedFiles(event.dataTransfer)) {
                            return;
                        }

                        event.preventDefault();

                        if (isUploadDisabled) {
                            dragDepthRef.current = 0;
                            setIsDragActive(false);
                            return;
                        }

                        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

                        if (dragDepthRef.current === 0) {
                            setIsDragActive(false);
                        }
                    }}
                    onDrop={handleDrop}
                >
                    {isListing && <LinearProgress className={classes.listingProgress} />}
                    {isDragActive && (
                        <div className={classes.dropOverlay}>
                            <div className={classes.dropOverlayFrame}>
                                <div className={classes.dropOverlayCard}>
                                    <div className={classes.dropOverlayIcon}>
                                        <Icon
                                            icon={getIconUrlByName("Description")}
                                            size="large"
                                        />
                                    </div>
                                    <div className={classes.dropOverlayTitle}>
                                        Drag and drop to import files
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={classes.contentShell}>
                        {items.length === 0 ? (
                            <div className={classes.emptyState}>
                                <div className={classes.emptyStateIcon}>
                                    <Icon
                                        icon={getIconUrlByName("Folder")}
                                        size="large"
                                    />
                                </div>
                                <div className={classes.emptyStateTitle}>
                                    This prefix is empty
                                </div>
                                <div className={classes.emptyStateDescription}>
                                    Upload files or create a folder to start populating
                                    this location.
                                </div>
                                <div className={classes.emptyStateActions}>
                                    <Button onClick={openFilePicker}>Upload files</Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            setIsCreateDirectoryDialogOpen(true)
                                        }
                                    >
                                        New folder
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={classes.tableScrollArea}>
                                <table className={classes.table}>
                                    <colgroup>
                                        <col className={classes.checkboxColumn} />
                                        <col className={classes.nameColumn} />
                                        <col className={classes.lastModifiedColumn} />
                                        <col className={classes.sizeColumn} />
                                    </colgroup>
                                    <thead>
                                        <tr className={classes.headerRow}>
                                            <th className={classes.checkboxHeaderCell}>
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    indeterminate={
                                                        isSelectionIndeterminate
                                                    }
                                                    onChange={() => {
                                                        if (isAllSelected) {
                                                            clearSelection();
                                                            return;
                                                        }

                                                        setSelectedItemKeys(
                                                            selectableItems.map(item =>
                                                                getItemKey(item)
                                                            )
                                                        );
                                                    }}
                                                    inputProps={{
                                                        "aria-label": "Select all items"
                                                    }}
                                                />
                                            </th>
                                            <th
                                                className={classes.headerCell}
                                                aria-sort={nameSortIndicator.ariaSort}
                                            >
                                                <button
                                                    type="button"
                                                    className={classes.sortButton}
                                                    onClick={() =>
                                                        handleSortToggle("name")
                                                    }
                                                >
                                                    Name
                                                    <span
                                                        className={cx(
                                                            classes.sortDirection,
                                                            nameSortIndicator.isActive &&
                                                                classes.sortDirectionActive
                                                        )}
                                                    >
                                                        <Icon
                                                            icon={nameSortIndicator.icon}
                                                            size="small"
                                                        />
                                                    </span>
                                                </button>
                                            </th>
                                            <th
                                                className={classes.headerCell}
                                                aria-sort={
                                                    lastModifiedSortIndicator.ariaSort
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className={classes.sortButton}
                                                    onClick={() =>
                                                        handleSortToggle("lastModified")
                                                    }
                                                >
                                                    Last modified
                                                    <span
                                                        className={cx(
                                                            classes.sortDirection,
                                                            lastModifiedSortIndicator.isActive &&
                                                                classes.sortDirectionActive
                                                        )}
                                                    >
                                                        <Icon
                                                            icon={
                                                                lastModifiedSortIndicator.icon
                                                            }
                                                            size="small"
                                                        />
                                                    </span>
                                                </button>
                                            </th>
                                            <th
                                                className={cx(
                                                    classes.headerCell,
                                                    classes.sizeHeaderCell
                                                )}
                                                aria-sort={sizeSortIndicator.ariaSort}
                                            >
                                                <button
                                                    type="button"
                                                    className={classes.sortButton}
                                                    onClick={() =>
                                                        handleSortToggle("size")
                                                    }
                                                >
                                                    Size
                                                    <span
                                                        className={cx(
                                                            classes.sortDirection,
                                                            sizeSortIndicator.isActive &&
                                                                classes.sortDirectionActive
                                                        )}
                                                    >
                                                        <Icon
                                                            icon={sizeSortIndicator.icon}
                                                            size="small"
                                                        />
                                                    </span>
                                                </button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => {
                                            const itemKey = getItemKey(item);

                                            return (
                                                <ItemRow
                                                    key={itemKey}
                                                    item={item}
                                                    isSelected={selectedItemKeySet.has(
                                                        itemKey
                                                    )}
                                                    isBookmarked={bookmarkedItemKeySet.has(
                                                        itemKey
                                                    )}
                                                    isStriped={index % 2 === 0}
                                                    showRowActions={showRowActions}
                                                    onRowClick={event =>
                                                        handleRowSelection({
                                                            item,
                                                            event
                                                        })
                                                    }
                                                    onCheckboxChange={() =>
                                                        toggleSelectionForItem(itemKey)
                                                    }
                                                    onNavigate={() =>
                                                        handleNavigate(item.s3Uri)
                                                    }
                                                    onDelete={() =>
                                                        requestDeletionForItems([item])
                                                    }
                                                    onShareObject={
                                                        item.type === "object"
                                                            ? () =>
                                                                  requestShareForObject(
                                                                      item
                                                                  )
                                                            : undefined
                                                    }
                                                    onChangePrefixPolicy={
                                                        item.type === "prefix segment" &&
                                                        getPrefixPolicyAction(item) !==
                                                            undefined
                                                            ? () =>
                                                                  requestPrefixPolicyChangeForItem(
                                                                      item
                                                                  )
                                                            : undefined
                                                    }
                                                    onDownload={
                                                        item.type === "object"
                                                            ? () =>
                                                                  requestDownloadForItems(
                                                                      [item]
                                                                  )
                                                            : undefined
                                                    }
                                                    onBookmark={
                                                        getIsItemActionAvailable(item)
                                                            ? () =>
                                                                  requestBookmarkForItem(
                                                                      item
                                                                  )
                                                            : undefined
                                                    }
                                                    onCopyS3Uri={() =>
                                                        copyItemS3Uri(item)
                                                    }
                                                />
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

const useStyles = tss
    .withName({ S3ExplorerMainView })
    .withParams<{ isDragActive: boolean }>()
    .withNestedSelectors<"rowActions" | "itemIconWrapper">()
    .create(({ theme, classes /*isDragActive*/ }) => ({
        root: {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minWidth: 0,
            minHeight: 0
        },
        surface: {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minWidth: 0,
            flex: 1,
            minHeight: 0,
            borderRadius: 0,
            overflow: "hidden",
            position: "relative",
            zIndex: 0,
            backgroundColor: "transparent",
            boxSizing: "border-box"
        },
        listingProgress: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 3,
            pointerEvents: "none"
        },
        selectionBarSlot: {
            display: "flex",
            alignItems: "center",
            minHeight: theme.spacing(6),
            padding: `0 ${theme.spacing(2)}`,
            boxSizing: "border-box",
            marginBottom: theme.spacing(2)
        },
        contentShell: {
            position: "relative",
            backgroundColor: "transparent",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column"
        },
        dropOverlay: {
            position: "absolute",
            inset: 0,
            zIndex: 2,
            backgroundColor: alpha(theme.colors.useCases.surfaces.background, 0.6),
            backdropFilter: "blur(1px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: theme.spacing(3)
        },
        dropOverlayFrame: {
            width: "100%",
            height: "100%",
            borderRadius: 24,
            border: `2px dashed ${theme.colors.useCases.typography.textFocus}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: theme.spacing(4),
            boxSizing: "border-box"
        },
        dropOverlayCard: {
            width: "min(440px, 100%)",
            borderRadius: 20,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            padding: theme.spacing(5),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: theme.spacing(2),
            textAlign: "center"
        },
        dropOverlayIcon: {
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        },
        dropOverlayTitle: {
            ...theme.typography.variants["label 1"].style,
            color: theme.colors.useCases.typography.textPrimary
        },
        emptyState: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: theme.spacing(4),
            gap: theme.spacing(1.5)
        },
        emptyStateIcon: {
            width: 56,
            height: 56,
            borderRadius: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        emptyStateTitle: {
            ...theme.typography.variants["label 1"].style,
            color: theme.colors.useCases.typography.textPrimary
        },
        emptyStateDescription: {
            maxWidth: 420,
            color: theme.colors.useCases.typography.textSecondary,
            lineHeight: 1.6
        },
        emptyStateActions: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: theme.spacing(1)
        },
        tableScrollArea: {
            overflowY: "auto",
            overflowX: "hidden",
            width: "100%"
        },
        table: {
            width: "100%",
            tableLayout: "fixed",
            borderCollapse: "separate",
            borderSpacing: 0
        },
        checkboxColumn: {
            width: 68
        },
        nameColumn: {},
        sizeColumn: {
            width: 140
        },
        lastModifiedColumn: {
            width: 200
        },
        headerRow: {
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: theme.colors.useCases.surfaces.background,
            "& th:last-of-type": {
                paddingRight: theme.spacing(3)
            }
        },
        checkboxHeaderCell: {
            width: 68,
            padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
            textAlign: "left",
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: theme.colors.useCases.surfaces.background,
            ...theme.typography.variants["label 1"].style,
            color: theme.colors.useCases.typography.textSecondary
        },
        headerCell: {
            padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
            textAlign: "left",
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: theme.colors.useCases.surfaces.background,
            ...theme.typography.variants["label 1"].style,
            color: theme.colors.useCases.typography.textSecondary
        },
        sizeHeaderCell: {},
        sortButton: {
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(1),
            color: "inherit",
            ...theme.typography.variants["label 1"].style
        },
        sortDirection: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 18,
            color: theme.colors.useCases.typography.textSecondary,
            lineHeight: 0,
            flexShrink: 0
        },
        sortDirectionActive: {
            color: theme.colors.useCases.typography.textFocus
        },
        tableRow: {
            backgroundColor: "transparent",
            "& td": {
                borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`
            },
            "& td:last-of-type": {
                paddingRight: theme.spacing(3)
            },
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface3
            },
            [`&:hover .${classes.rowActions}`]: {
                opacity: 1,
                visibility: "visible",
                pointerEvents: "auto"
            },
            [`&:has(:focus-visible) .${classes.rowActions}`]: {
                opacity: 1,
                visibility: "visible",
                pointerEvents: "auto"
            }
        },
        tableRowStriped: {
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        tableRowSelected: {
            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1,
            [`&:hover`]: {
                backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
            },
            [`& .${classes.itemIconWrapper}`]: {
                backgroundColor: theme.colors.useCases.surfaces.surfaceFocus2
            },
            [`& .${classes.rowActions}`]: {
                opacity: 1,
                visibility: "visible",
                pointerEvents: "auto"
            }
        },
        tableRowBusy: {
            opacity: 0.66
        },
        checkboxCell: {
            width: 68,
            padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
            verticalAlign: "middle"
        },
        nameCell: {
            padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
            minWidth: 240
        },
        nameCellContent: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2),
            minWidth: 0
        },
        metaCell: {
            padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
            color: theme.colors.useCases.typography.textSecondary,
            whiteSpace: "nowrap",
            verticalAlign: "middle",
            ...theme.typography.variants["body 2"].style
        },
        sizeCell: {},
        itemIdentity: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            minWidth: 0,
            flex: 1
        },
        itemIconWrapper: {
            width: 32,
            height: 32,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            color: theme.colors.useCases.typography.textPrimary,
            flexShrink: 0
        },
        itemNameBlock: {
            minWidth: 0,
            flex: 1
        },
        itemPrimaryRow: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1),
            minWidth: 0
        },
        itemNameButton: {
            ...theme.typography.variants["label 1"].style,
            display: "block",
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            color: theme.colors.useCases.typography.textPrimary,
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            flex: "0 1 auto",
            "&:disabled": {
                cursor: "default",
                opacity: 0.72
            }
        },
        itemPublicTag: {
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(0.75),
            borderRadius: 999,
            ...theme.spacing.topBottom("padding", 1),
            ...theme.spacing.rightLeft("padding", 2),
            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus2,
            color: theme.colors.useCases.typography.textPrimary,
            whiteSpace: "nowrap",
            flexShrink: 0,
            ...theme.typography.variants["body 2"].style,
            marginLeft: theme.spacing(2)
        },
        itemMetaRow: {
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(1),
            flexShrink: 0
        },
        statusPill: {
            display: "inline-flex",
            alignItems: "center",
            minHeight: 24,
            borderRadius: 999,
            padding: `${theme.spacing(0.5)} ${theme.spacing(1.25)}`,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1,
            whiteSpace: "nowrap",
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            color: theme.colors.useCases.typography.textPrimary
        },
        statusPillWarning: {
            backgroundColor: theme.colors.useCases.surfaces.surface3
        },
        statusPillUploading: {
            gap: theme.spacing(0.5),
            paddingLeft: theme.spacing(1.5),
            paddingRight: theme.spacing(1.5)
        },
        statusPillLabel: {
            display: "inline-block"
        },
        statusPillPercent: {
            display: "inline-block",
            minWidth: "4ch",
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
            fontFeatureSettings: '"tnum"'
        },
        inlineProgressTrack: {
            width: 96,
            height: 6,
            borderRadius: 999,
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            overflow: "hidden",
            flexShrink: 0
        },
        inlineProgressFill: {
            height: "100%",
            borderRadius: 999,
            backgroundColor: theme.colors.useCases.typography.textFocus
        },
        rowActions: {
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(2),
            opacity: 0,
            visibility: "hidden",
            pointerEvents: "none",
            transition: "opacity 120ms ease",
            minWidth: 160,
            justifyContent: "flex-end",
            color: theme.colors.useCases.typography.textSecondary,
            flexShrink: 0,
            paddingRight: theme.spacing(4)
        },
        rowActionButton: {
            border: "none",
            backgroundColor: "transparent",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "inherit",
            borderRadius: 9999,
            padding: theme.spacing(0.5),
            width: 32,
            height: 32,
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface3
            },
            "&:active": {
                backgroundColor: theme.colors.useCases.surfaces.surface2
            },
            "&:disabled": {
                cursor: "default",
                opacity: 0.42
            }
        },
        rowActionButtonActive: {
            color: theme.colors.useCases.typography.textFocus,
            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus2,
            "&:hover": {
                color: theme.colors.useCases.typography.textFocus,
                backgroundColor: theme.colors.useCases.surfaces.surfaceFocus2
            },
            "& .MuiSvgIcon-root, & svg, & img, & path": {
                color: theme.colors.useCases.typography.textFocus,
                fill: theme.colors.useCases.typography.textFocus
            }
        },
        inlineActionWrapper: {
            display: "inline-flex"
        },
        errorState: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: theme.spacing(4),
            gap: theme.spacing(1.5),
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            borderRadius: 20
        },
        errorIcon: {
            width: 56,
            height: 56,
            borderRadius: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        errorTitle: {
            ...theme.typography.variants["label 1"].style,
            color: theme.colors.useCases.typography.textPrimary
        },
        errorDescription: {
            maxWidth: 460,
            color: theme.colors.useCases.typography.textSecondary,
            lineHeight: 1.6
        }
    }));

const { i18n } = declareComponentKeys<
    | "create prefix dialog title"
    | "create prefix dialog subtitle"
    | "prefix name field label"
    | "prefix name empty error"
    | "cancel"
    | "create prefix"
    | "delete selection dialog title"
    | "delete selection dialog subtitle"
    | { K: "delete selection dialog body"; P: { count: number }; R: string }
    | "delete"
    | "uploaded"
    | "share"
    | "download"
    | "copy s3 path"
    | "add to bookmarks"
    | "delete from bookmarks"
    | "make public"
    | "make private"
    | "folder"
    | "object"
    | "folder is public"
    | "folder is private"
>()({ S3ExplorerMainView });
export type I18n = typeof i18n;
