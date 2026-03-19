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
import { getFormattedDate } from "ui/shared/formattedDate/getFormattedDate";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { useLang } from "ui/i18n";

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

function getUserFacingErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message !== "") {
        return error.message;
    }

    return "Unable to generate a shareable link for this file.";
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
    lang: string;
    isSelected: boolean;
    onRowClick: (event: MouseEvent<HTMLTableRowElement>) => void;
    onNavigate: () => void;
    onDelete: () => void;
    onShare: (() => void) | undefined;
    onCheckboxChange: () => void;
};

function ItemRow(props: ItemRowProps) {
    const {
        item,
        lang,
        isSelected,
        onRowClick,
        onNavigate,
        onDelete,
        onShare,
        onCheckboxChange
    } = props;

    const progressPercent = getProgressPercent(item);
    const isUploadInProgress =
        progressPercent !== undefined && progressPercent < 100 && !item.isDeleting;
    const canNavigate =
        !item.isDeleting && !(item.type === "object" && isUploadInProgress);

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
                <div className={classes.itemIdentity}>
                    <div className={classes.itemIconWrapper}>
                        <Icon
                            icon={getIconUrlByName(
                                item.type === "prefix segment" ? "Folder" : "Description"
                            )}
                            size="small"
                        />
                    </div>
                    <div className={classes.itemNameBlock}>
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
                                    <span className={classes.statusPill}>
                                        Uploading {Math.round(progressPercent)}%
                                    </span>
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
                        {isUploadInProgress && (
                            <div className={classes.inlineProgressTrack}>
                                <div
                                    className={classes.inlineProgressFill}
                                    style={{
                                        width: `${progressPercent}%`
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className={classes.metaCell}>
                {item.type === "object" ? getFormattedSize(item.size) : "Folder"}
            </td>
            <td className={classes.metaCell}>
                {item.type === "object"
                    ? getFormattedDate({
                          time: item.lastModified,
                          lang
                      })
                    : " "}
            </td>
            <td className={classes.actionsCell}>
                <div className={classes.rowActions}>
                    <Tooltip
                        title={
                            item.type === "prefix segment" ? "Open folder" : "Open file"
                        }
                    >
                        <span className={classes.inlineActionWrapper}>
                            <IconButton
                                icon={getIconUrlByName("OpenInNew")}
                                disabled={!canNavigate}
                                onClick={event => {
                                    event.stopPropagation();
                                    onNavigate();
                                }}
                            />
                        </span>
                    </Tooltip>

                    {item.type === "object" && (
                        <Tooltip title="Get shareable link">
                            <span className={classes.inlineActionWrapper}>
                                <IconButton
                                    icon={getIconUrlByName("Link")}
                                    disabled={
                                        onShare === undefined ||
                                        item.isDeleting ||
                                        isUploadInProgress
                                    }
                                    onClick={event => {
                                        event.stopPropagation();

                                        if (onShare === undefined) {
                                            return;
                                        }

                                        onShare();
                                    }}
                                />
                            </span>
                        </Tooltip>
                    )}

                    <Tooltip title="Delete">
                        <span className={classes.inlineActionWrapper}>
                            <IconButton
                                icon={getIconUrlByName("Delete")}
                                disabled={item.isDeleting}
                                onClick={event => {
                                    event.stopPropagation();
                                    onDelete();
                                }}
                            />
                        </span>
                    </Tooltip>
                </div>
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

    const { lang } = useLang();
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
                errorMessage: getUserFacingErrorMessage(error)
            });
        }
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

    const handleNavigate = (s3Uri: S3Uri) => {
        clearSelection();
        onNavigate({ s3Uri });
    };

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

                <div className={classes.toolbar}>
                    <div className={classes.toolbarPrimaryActions}>
                        <Button
                            startIcon={getIconUrlByName("Add")}
                            onClick={openFilePicker}
                        >
                            Upload files
                        </Button>
                        <Button
                            variant="secondary"
                            startIcon={getIconUrlByName("Add")}
                            onClick={() => setIsCreateDirectoryDialogOpen(true)}
                        >
                            New folder
                        </Button>
                    </div>

                    <div className={classes.toolbarSecondaryActions}>
                        <Button
                            variant="secondary"
                            startIcon={getIconUrlByName("Link")}
                            disabled={!isSelectedObjectShareable}
                            onClick={
                                !isSelectedObjectShareable ||
                                selectedObjectForShare === undefined
                                    ? undefined
                                    : () => requestShareLink(selectedObjectForShare)
                            }
                        >
                            Get link
                        </Button>
                        <Button
                            variant="secondary"
                            startIcon={getIconUrlByName("Delete")}
                            disabled={selectedItems.length === 0}
                            onClick={() => requestDeletionForItems(selectedItems)}
                        >
                            Delete
                        </Button>
                    </div>
                </div>

                <div className={classes.summaryBar}>
                    <div className={classes.summaryText}>
                        {selectedItems.length > 0
                            ? `${selectedItems.length} selected`
                            : `${items.length} item${items.length > 1 ? "s" : ""}`}
                    </div>
                    <div className={classes.summaryTextMuted}>
                        {isListing
                            ? "Refreshing listing..."
                            : "Drag files anywhere in this panel to upload."}
                    </div>
                    {selectedItems.length > 0 && (
                        <button
                            type="button"
                            className={classes.clearSelectionButton}
                            onClick={clearSelection}
                        >
                            Clear selection
                        </button>
                    )}
                </div>

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
                                        <th className={classes.headerCell}>
                                            <button
                                                type="button"
                                                className={classes.sortButton}
                                                onClick={() => handleSortToggle("name")}
                                            >
                                                Name
                                                <span className={classes.sortDirection}>
                                                    {sortState.key === "name"
                                                        ? sortState.direction === "asc"
                                                            ? "ASC"
                                                            : "DESC"
                                                        : ""}
                                                </span>
                                            </button>
                                        </th>
                                        <th className={classes.headerCell}>
                                            <button
                                                type="button"
                                                className={classes.sortButton}
                                                onClick={() => handleSortToggle("size")}
                                            >
                                                Size
                                                <span className={classes.sortDirection}>
                                                    {sortState.key === "size"
                                                        ? sortState.direction === "asc"
                                                            ? "ASC"
                                                            : "DESC"
                                                        : ""}
                                                </span>
                                            </button>
                                        </th>
                                        <th className={classes.headerCell}>
                                            <button
                                                type="button"
                                                className={classes.sortButton}
                                                onClick={() =>
                                                    handleSortToggle("lastModified")
                                                }
                                            >
                                                Last modified
                                                <span className={classes.sortDirection}>
                                                    {sortState.key === "lastModified"
                                                        ? sortState.direction === "asc"
                                                            ? "ASC"
                                                            : "DESC"
                                                        : ""}
                                                </span>
                                            </button>
                                        </th>
                                        <th className={classes.actionsHeaderCell}>
                                            Actions
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
                                                lang={lang}
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
            marginTop: theme.spacing(3),
            display: "flex",
            flexDirection: "column",
            width: "100%",
            borderRadius: 20,
            overflow: "hidden",
            position: "relative",
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            boxShadow: theme.shadows[1],
            boxSizing: "border-box",
            outline: isDragActive
                ? `2px solid ${theme.colors.useCases.typography.textFocus}`
                : "2px solid transparent",
            outlineOffset: -2
        },
        listingProgress: {
            width: "100%"
        },
        toolbar: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: theme.spacing(2),
            padding: theme.spacing(2),
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            flexWrap: "wrap"
        },
        toolbarPrimaryActions: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            flexWrap: "wrap"
        },
        toolbarSecondaryActions: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            flexWrap: "wrap"
        },
        summaryBar: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2),
            padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            flexWrap: "wrap"
        },
        summaryText: {
            ...theme.typography.variants["label 1"].style,
            color: theme.colors.useCases.typography.textPrimary
        },
        summaryTextMuted: {
            color: theme.colors.useCases.typography.textSecondary,
            fontSize: 13
        },
        clearSelectionButton: {
            marginLeft: "auto",
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            color: theme.colors.useCases.typography.textPrimary,
            ...theme.typography.variants["label 1"].style
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
            overflow: "auto",
            width: "100%"
        },
        table: {
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0
        },
        headerRow: {
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: theme.colors.useCases.surfaces.surface1
        },
        checkboxHeaderCell: {
            width: 68,
            padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
            textAlign: "left",
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: theme.colors.useCases.surfaces.surface1
        },
        headerCell: {
            padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
            textAlign: "left",
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: theme.colors.useCases.surfaces.surface1
        },
        actionsHeaderCell: {
            width: 120,
            padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
            textAlign: "right",
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            color: theme.colors.useCases.typography.textSecondary,
            fontSize: 13
        },
        sortButton: {
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(1),
            color: theme.colors.useCases.typography.textSecondary,
            fontSize: 13,
            fontWeight: 600
        },
        sortDirection: {
            minWidth: 32,
            color: theme.colors.useCases.typography.textPrimary,
            fontSize: 11,
            letterSpacing: "0.04em"
        },
        tableRow: {
            "& td": {
                borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`
            },
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface2
            },
            [`&:hover .${classes.rowActions}`]: {
                opacity: 1
            }
        },
        tableRowSelected: {
            backgroundColor: theme.colors.useCases.surfaces.surface2
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
        metaCell: {
            padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
            color: theme.colors.useCases.typography.textSecondary,
            whiteSpace: "nowrap",
            verticalAlign: "middle",
            fontSize: 13
        },
        actionsCell: {
            padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
            textAlign: "right",
            verticalAlign: "middle"
        },
        itemIdentity: {
            display: "flex",
            alignItems: "flex-start",
            gap: theme.spacing(1.5),
            minWidth: 0
        },
        itemIconWrapper: {
            width: 32,
            height: 32,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            flexShrink: 0
        },
        itemNameBlock: {
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(0.75)
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
            "&:disabled": {
                cursor: "default",
                opacity: 0.72
            }
        },
        itemMetaRow: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1),
            flexWrap: "wrap"
        },
        statusPill: {
            display: "inline-flex",
            alignItems: "center",
            minHeight: 22,
            borderRadius: 999,
            padding: `${theme.spacing(0.25)} ${theme.spacing(1)}`,
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            color: theme.colors.useCases.typography.textPrimary
        },
        statusPillWarning: {
            backgroundColor: theme.colors.useCases.surfaces.surface3
        },
        inlineProgressTrack: {
            width: 140,
            height: 6,
            borderRadius: 999,
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            overflow: "hidden"
        },
        inlineProgressFill: {
            height: "100%",
            borderRadius: 999,
            backgroundColor: theme.colors.useCases.typography.textFocus
        },
        rowActions: {
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(0.5),
            opacity: 0.3,
            transition: "opacity 120ms ease"
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
            borderRadius: 20,
            boxShadow: theme.shadows[1]
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
