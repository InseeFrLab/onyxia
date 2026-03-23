import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
    type MouseEvent
} from "react";
import bytes from "bytes";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import { Evt } from "evt";
import { assert } from "tsafe/assert";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { Dialog } from "onyxia-ui/Dialog";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { TextField, type TextFieldProps } from "onyxia-ui/TextField";
import { Tooltip } from "onyxia-ui/Tooltip";
import { useConst } from "powerhooks/useConst";
import { getIconUrlByName } from "lazy-icons";
import { type S3Uri, stringifyS3Uri } from "core/tools/S3Uri";
import { S3SelectionActionBar } from "ui/shared/codex/S3SelectionActionBar";
import { copyToClipboard } from "ui/tools/copyToClipboard";

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

    getDirectDownloadUrl: (params: {
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        validityDurationSecond?: number;
    }) => Promise<string>;
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

type DeleteDialogState = {
    items: S3ExplorerMainViewProps.Item[];
};

type ShareLinkDialogState =
    | {
          status: "loading";
          item: S3ExplorerMainViewProps.Item.Object;
      }
    | {
          status: "ready";
          item: S3ExplorerMainViewProps.Item.Object;
          url: string;
      }
    | {
          status: "error";
          item: S3ExplorerMainViewProps.Item.Object;
          errorMessage: string;
      };

function getItemKey(item: S3ExplorerMainViewProps.Item): string {
    return stringifyS3Uri(item.s3Uri);
}

function getObjectsToUploadFromFiles(files: readonly File[]) {
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

function getUserFacingErrorMessage(params: {
    error: unknown;
    fallbackMessage: string;
}): string {
    const { error, fallbackMessage } = params;

    if (error instanceof Error && error.message !== "") {
        return error.message;
    }

    return fallbackMessage;
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

    const [draft, setDraft] = useState("");
    const [isDraftValid, setIsDraftValid] = useState(false);

    const evtTextFieldAction = useConst(() => Evt.create<TextFieldProps["evtAction"]>());

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
            title="Create folder"
            subtitle="Folders are created relative to the prefix currently being listed."
            body={
                open && (
                    <TextField
                        inputProps_autoFocus={true}
                        label="Folder name"
                        defaultValue=""
                        evtAction={evtTextFieldAction}
                        getIsValidValue={value => {
                            const normalizedValue = value.trim();

                            if (normalizedValue === "") {
                                return {
                                    isValidValue: false,
                                    message: "Folder name cannot be empty."
                                };
                            }

                            return {
                                isValidValue: true
                            };
                        }}
                        onValueBeingTypedChange={({ value, isValidValue }) => {
                            setDraft(value);
                            setIsDraftValid(isValidValue);
                        }}
                        onEnterKeyDown={({ preventDefaultAndStopPropagation }) => {
                            preventDefaultAndStopPropagation();

                            if (!isDraftValid) {
                                return;
                            }

                            evtTextFieldAction.post("TRIGGER SUBMIT");
                        }}
                        onSubmit={() => {
                            submit();
                        }}
                    />
                )
            }
            buttons={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!isDraftValid}
                        onClick={
                            isDraftValid
                                ? () => evtTextFieldAction.post("TRIGGER SUBMIT")
                                : undefined
                        }
                    >
                        Create folder
                    </Button>
                </>
            }
        />
    );
}

function DeleteSelectionDialog(props: {
    state: DeleteDialogState | undefined;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const { state, onClose, onConfirm } = props;

    return (
        <Dialog
            isOpen={state !== undefined}
            onClose={onClose}
            title="Delete selection"
            subtitle={
                state === undefined
                    ? ""
                    : `This will permanently delete ${state.items.length} selected item${state.items.length > 1 ? "s" : ""}.`
            }
            body={
                state !== undefined && (
                    <div>
                        <div
                            style={{
                                marginBottom: 16,
                                lineHeight: 1.5
                            }}
                        >
                            Deleted folders remove everything inside them.
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                maxHeight: 220,
                                overflow: "auto"
                            }}
                        >
                            {state.items.map(item => (
                                <div key={getItemKey(item)}>
                                    {item.displayName}
                                    {item.type === "prefix segment" ? "/" : ""}
                                </div>
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
                    <Button onClick={onConfirm}>Delete</Button>
                </>
            }
        />
    );
}

function ShareLinkDialog(props: {
    state: ShareLinkDialogState | undefined;
    onClose: () => void;
    onRetry: () => void;
}) {
    const { state, onClose, onRetry } = props;

    return (
        <Dialog
            isOpen={state !== undefined}
            onClose={onClose}
            title="Shareable link"
            subtitle={state === undefined ? "" : state.item.displayName}
            body={
                state !== undefined && (
                    <div
                        style={{
                            minWidth: 320,
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            paddingTop: 8
                        }}
                    >
                        {state.status === "loading" && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12
                                }}
                            >
                                <CircularProgress size={18} />
                                <span>Generating a direct download URL...</span>
                            </div>
                        )}

                        {state.status === "error" && (
                            <div
                                style={{
                                    lineHeight: 1.6
                                }}
                            >
                                {state.errorMessage}
                            </div>
                        )}

                        {state.status === "ready" && (
                            <>
                                <div
                                    style={{
                                        lineHeight: 1.6
                                    }}
                                >
                                    Anyone with this URL can download the file until it
                                    expires.
                                </div>
                                <div
                                    style={{
                                        borderRadius: 12,
                                        padding: 16,
                                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                                        wordBreak: "break-all",
                                        fontFamily:
                                            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                                        fontSize: 13,
                                        lineHeight: 1.5
                                    }}
                                >
                                    {state.url}
                                </div>
                            </>
                        )}
                    </div>
                )
            }
            buttons={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                    {state?.status === "error" && (
                        <Button onClick={onRetry}>Retry</Button>
                    )}
                    {state?.status === "ready" && (
                        <>
                            <Button
                                variant="secondary"
                                startIcon={getIconUrlByName("OpenInNew")}
                                onClick={() =>
                                    window.open(
                                        state.url,
                                        "_blank",
                                        "noopener,noreferrer"
                                    )
                                }
                            >
                                Open
                            </Button>
                            <Button onClick={() => copyToClipboard(state.url)}>
                                Copy link
                            </Button>
                        </>
                    )}
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

type ItemRowProps = {
    item: S3ExplorerMainViewProps.Item;
    isSelected: boolean;
    onRowClick: (event: MouseEvent<HTMLTableRowElement>) => void;
    onNavigate: () => void;
    onDelete: () => void;
    onShare: (() => void) | undefined;
    onDownload: (() => void) | undefined;
    onCopyS3Uri: () => void;
    onCheckboxChange: () => void;
};

function ItemRow(props: ItemRowProps) {
    const {
        item,
        isSelected,
        onRowClick,
        onNavigate,
        onDelete,
        onShare,
        onDownload,
        onCopyS3Uri,
        onCheckboxChange
    } = props;

    const progressPercent = getProgressPercent(item);
    const isUploadInProgress =
        progressPercent !== undefined && progressPercent < 100 && !item.isDeleting;
    const canNavigate =
        !item.isDeleting && !(item.type === "object" && isUploadInProgress);
    const isDownloadAvailable =
        onDownload !== undefined &&
        !item.isDeleting &&
        !isUploadInProgress &&
        (progressPercent === undefined || progressPercent === 100);
    const isShareAvailable =
        onShare !== undefined &&
        !item.isDeleting &&
        !isUploadInProgress &&
        (progressPercent === undefined || progressPercent === 100);
    const isCopyAvailable = !item.isDeleting;

    const { classes, cx } = useStyles({
        isDragActive: false
    });

    return (
        <tr
            className={cx(
                classes.tableRow,
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
                        <div className={classes.itemIconWrapper}>
                            <Icon
                                icon={getIconUrlByName(
                                    item.type === "prefix segment"
                                        ? "Folder"
                                        : "Description"
                                )}
                                size="small"
                            />
                        </div>
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
                                                    Uploaded
                                                </span>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={classes.rowActions}>
                        {onShare !== undefined && (
                            <Tooltip title="Get shareable link">
                                <span className={classes.inlineActionWrapper}>
                                    <IconButton
                                        className={classes.rowActionButton}
                                        icon={getIconUrlByName("Share")}
                                        aria-label="Get shareable link"
                                        disabled={!isShareAvailable}
                                        onClick={event => {
                                            event.stopPropagation();

                                            if (
                                                !isShareAvailable ||
                                                onShare === undefined
                                            ) {
                                                return;
                                            }

                                            onShare();
                                        }}
                                    />
                                </span>
                            </Tooltip>
                        )}
                        {onDownload !== undefined && (
                            <Tooltip title="Download">
                                <span className={classes.inlineActionWrapper}>
                                    <IconButton
                                        className={classes.rowActionButton}
                                        icon={getIconUrlByName("FileDownload")}
                                        aria-label="Download"
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
                        <Tooltip title="Copy S3 path">
                            <span className={classes.inlineActionWrapper}>
                                <IconButton
                                    className={classes.rowActionButton}
                                    icon={getIconUrlByName("ContentCopy")}
                                    aria-label="Copy S3 path"
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
                        <Tooltip title="Delete">
                            <span className={classes.inlineActionWrapper}>
                                <IconButton
                                    className={classes.rowActionButton}
                                    icon={getIconUrlByName("Delete")}
                                    aria-label="Delete"
                                    disabled={item.isDeleting}
                                    onClick={event => {
                                        event.stopPropagation();
                                        onDelete();
                                    }}
                                />
                            </span>
                        </Tooltip>
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
        getDirectDownloadUrl
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
    const [shareLinkDialogState, setShareLinkDialogState] = useState<
        ShareLinkDialogState | undefined
    >(undefined);
    const [isDragActive, setIsDragActive] = useState(false);

    const lastSelectedItemKeyRef = useRef<string | undefined>(undefined);
    const dragDepthRef = useRef(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const shareRequestIdRef = useRef(0);

    const { classes, cx } = useStyles({ isDragActive });

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

    const items = listedPrefix.isErrored
        ? []
        : getSortedItems({
              items: listedPrefix.items,
              sortState
          });

    const selectableItems = items.filter(item => !item.isDeleting);
    const selectedItemKeySet = new Set(selectedItemKeys);
    const selectedItems = items.filter(item => selectedItemKeySet.has(getItemKey(item)));
    const selectedObjects = selectedItems.filter(
        (item): item is S3ExplorerMainViewProps.Item.Object => item.type === "object"
    );
    const selectedS3Uris = selectedItems.map(item => item.s3Uri);

    const isAllSelected =
        selectableItems.length > 0 &&
        selectableItems.every(item => selectedItemKeySet.has(getItemKey(item)));
    const isSelectionIndeterminate =
        !isAllSelected && selectedItems.length > 0 && selectableItems.length > 0;

    const selectedObjectForShare =
        selectedItems.length === 1 && selectedObjects.length === 1
            ? selectedObjects[0]
            : undefined;
    const isSelectedObjectShareable =
        selectedObjectForShare !== undefined &&
        !selectedObjectForShare.isDeleting &&
        (() => {
            const progressPercent = getProgressPercent(selectedObjectForShare);

            return progressPercent === undefined || progressPercent === 100;
        })();

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

    const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);

        handleUploadFiles(files);

        event.target.value = "";
    };

    const closeShareDialog = () => {
        shareRequestIdRef.current += 1;
        setShareLinkDialogState(undefined);
    };

    const requestShareLink = async (item: S3ExplorerMainViewProps.Item.Object) => {
        const requestId = shareRequestIdRef.current + 1;

        shareRequestIdRef.current = requestId;
        setShareLinkDialogState({
            status: "loading",
            item
        });

        try {
            const url = await getDirectDownloadUrl({
                s3Uri: item.s3Uri
            });

            if (shareRequestIdRef.current !== requestId) {
                return;
            }

            setShareLinkDialogState({
                status: "ready",
                item,
                url
            });
        } catch (error) {
            if (shareRequestIdRef.current !== requestId) {
                return;
            }

            setShareLinkDialogState({
                status: "error",
                item,
                errorMessage: getUserFacingErrorMessage({
                    error,
                    fallbackMessage: "Unable to generate a shareable link for this file."
                })
            });
        }
    };

    const requestDownloadForItems = async (
        itemsToDownload: S3ExplorerMainViewProps.Item[]
    ) => {
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

        await Promise.all(
            downloadableObjects.map(async item => {
                try {
                    const url = await getDirectDownloadUrl({
                        s3Uri: item.s3Uri
                    });

                    window.open(url, "_blank", "noopener,noreferrer");
                } catch {
                    return;
                }
            })
        );
    };

    const requestDeletionForItems = (itemsToDelete: S3ExplorerMainViewProps.Item[]) => {
        if (itemsToDelete.length === 0) {
            return;
        }

        setDeleteDialogState({
            items: itemsToDelete
        });
    };

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const clearSelection = () => {
        setSelectedItemKeys([]);
        lastSelectedItemKeyRef.current = undefined;
    };

    const copySelectedS3Uri = () => {
        if (selectedItems.length !== 1) {
            return;
        }

        copyToClipboard(stringifyS3Uri(selectedItems[0].s3Uri));
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
                <ErrorState errorCase={listedPrefix.errorCase} />
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

            <ShareLinkDialog
                state={shareLinkDialogState}
                onClose={closeShareDialog}
                onRetry={() => {
                    if (shareLinkDialogState === undefined) {
                        return;
                    }

                    requestShareLink(shareLinkDialogState.item);
                }}
            />

            <div className={classes.selectionBarSlot}>
                {selectedItems.length > 0 && (
                    <S3SelectionActionBar
                        selectedS3Uris={selectedS3Uris}
                        onClear={clearSelection}
                        onDownload={() => requestDownloadForItems(selectedItems)}
                        onDelete={() => requestDeletionForItems(selectedItems)}
                        onCopyS3Uri={copySelectedS3Uri}
                        onShare={() => {
                            if (
                                selectedObjectForShare === undefined ||
                                !isSelectedObjectShareable
                            ) {
                                return;
                            }

                            requestShareLink(selectedObjectForShare);
                        }}
                        onRename={() => {
                            return;
                        }}
                    />
                )}
            </div>

            <div
                className={cx(classes.root, className)}
                aria-busy={isListing}
                onDragEnter={(event: DragEvent<HTMLDivElement>) => {
                    if (!event.dataTransfer.types.includes("Files")) {
                        return;
                    }

                    event.preventDefault();
                    dragDepthRef.current += 1;
                    setIsDragActive(true);
                }}
                onDragOver={(event: DragEvent<HTMLDivElement>) => {
                    if (!event.dataTransfer.types.includes("Files")) {
                        return;
                    }

                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                    setIsDragActive(true);
                }}
                onDragLeave={(event: DragEvent<HTMLDivElement>) => {
                    if (!event.dataTransfer.types.includes("Files")) {
                        return;
                    }

                    event.preventDefault();
                    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

                    if (dragDepthRef.current === 0) {
                        setIsDragActive(false);
                    }
                }}
                onDrop={(event: DragEvent<HTMLDivElement>) => {
                    if (!event.dataTransfer.types.includes("Files")) {
                        return;
                    }

                    event.preventDefault();
                    dragDepthRef.current = 0;
                    setIsDragActive(false);

                    handleUploadFiles(Array.from(event.dataTransfer.files));
                }}
            >
                {isListing && <LinearProgress className={classes.listingProgress} />}

                <div className={classes.contentShell}>
                    {isDragActive && (
                        <div className={classes.dropOverlay}>
                            <div className={classes.dropOverlayCard}>
                                <Icon icon={getIconUrlByName("Add")} size="large" />
                                <div className={classes.dropOverlayTitle}>
                                    Drop files to upload
                                </div>
                                <div className={classes.dropOverlayDescription}>
                                    Files will be uploaded into the currently listed
                                    prefix.
                                </div>
                            </div>
                        </div>
                    )}

                    {items.length === 0 ? (
                        <div className={classes.emptyState}>
                            <div className={classes.emptyStateIcon}>
                                <Icon icon={getIconUrlByName("Folder")} size="large" />
                            </div>
                            <div className={classes.emptyStateTitle}>
                                This prefix is empty
                            </div>
                            <div className={classes.emptyStateDescription}>
                                Upload files or create a folder to start populating this
                                location.
                            </div>
                            <div className={classes.emptyStateActions}>
                                <Button onClick={openFilePicker}>Upload files</Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsCreateDirectoryDialogOpen(true)}
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
                                                indeterminate={isSelectionIndeterminate}
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
                                                onClick={() => handleSortToggle("name")}
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
                                            aria-sort={lastModifiedSortIndicator.ariaSort}
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
                                                onClick={() => handleSortToggle("size")}
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
                                    {items.map(item => {
                                        const itemKey = getItemKey(item);

                                        return (
                                            <ItemRow
                                                key={itemKey}
                                                item={item}
                                                isSelected={selectedItemKeySet.has(
                                                    itemKey
                                                )}
                                                onRowClick={event =>
                                                    handleRowSelection({ item, event })
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
                                                onShare={
                                                    item.type === "object"
                                                        ? () => requestShareLink(item)
                                                        : undefined
                                                }
                                                onDownload={
                                                    item.type === "object"
                                                        ? () =>
                                                              requestDownloadForItems([
                                                                  item
                                                              ])
                                                        : undefined
                                                }
                                                onCopyS3Uri={() =>
                                                    copyToClipboard(
                                                        stringifyS3Uri(item.s3Uri)
                                                    )
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
        </>
    );
}

const useStyles = tss
    .withName({ S3ExplorerMainView })
    .withParams<{ isDragActive: boolean }>()
    .withNestedSelectors<"rowActions">()
    .create(({ theme, classes, isDragActive }) => ({
        root: {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            borderRadius: 20,
            overflow: isDragActive ? "visible" : "hidden",
            position: "relative",
            zIndex: 0,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            boxSizing: "border-box",
            outline: isDragActive
                ? `2px solid ${theme.colors.useCases.typography.textFocus}`
                : "2px solid transparent",
            outlineOffset: -2
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
            minHeight: theme.spacing(7),
            padding: `0 ${theme.spacing(2)}`,
            boxSizing: "border-box",
            marginBottom: theme.spacing(2)
        },
        contentShell: {
            position: "relative",
            backgroundColor: theme.colors.useCases.surfaces.surface1
        },
        dropOverlay: {
            position: "absolute",
            inset: 0,
            zIndex: 2,
            backgroundColor: "rgba(255, 255, 255, 0.72)",
            backdropFilter: "blur(3px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: theme.spacing(3)
        },
        dropOverlayCard: {
            width: "min(440px, 100%)",
            borderRadius: 20,
            border: `2px dashed ${theme.colors.useCases.typography.textFocus}`,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            padding: theme.spacing(5),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: theme.spacing(1.5),
            textAlign: "center"
        },
        dropOverlayTitle: {
            ...theme.typography.variants["label 1"].style,
            color: theme.colors.useCases.typography.textPrimary
        },
        dropOverlayDescription: {
            color: theme.colors.useCases.typography.textSecondary,
            lineHeight: 1.6
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
            backgroundColor: "transparent",
            "& th:last-of-type": {
                paddingRight: theme.spacing(3)
            }
        },
        checkboxHeaderCell: {
            width: 68,
            padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
            textAlign: "left",
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: "transparent",
            ...theme.typography.variants["label 1"].style,
            color: theme.colors.useCases.typography.textSecondary
        },
        headerCell: {
            padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
            textAlign: "left",
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: "transparent",
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
            [`&:focus-within .${classes.rowActions}`]: {
                opacity: 1,
                visibility: "visible",
                pointerEvents: "auto"
            }
        },
        tableRowSelected: {
            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1,
            [`&:hover`]: {
                backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
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
            flex: 1,
            "&:disabled": {
                cursor: "default",
                opacity: 0.72
            }
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
            color: "inherit",
            borderRadius: 9999,
            padding: theme.spacing(0.5),
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface3
            },
            "&:active": {
                backgroundColor: theme.colors.useCases.surfaces.surface2
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
