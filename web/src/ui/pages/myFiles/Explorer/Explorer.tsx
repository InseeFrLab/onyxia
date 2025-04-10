import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { useState, useEffect, useMemo, memo } from "react";
import type { RefObject } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { ExplorerItemsProps as ItemsProps } from "./ExplorerItems";
import { Breadcrumb } from "onyxia-ui/Breadcrumb";
import type { BreadcrumbProps } from "onyxia-ui/Breadcrumb";
import { Props as ButtonBarProps } from "./ExplorerButtonBar";
import { Evt } from "evt";
import { join as pathJoin } from "pathe";
import { useTranslation } from "ui/i18n";
import { CommandBar, type CommandBarProps } from "ui/shared/CommandBar";
import {
    generateUniqDefaultName,
    buildNameFactory
} from "ui/tools/generateUniqDefaultName";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import type { NonPostableEvt, StatefulReadonlyEvt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { ExplorerItems } from "./ExplorerItems";
import { ExplorerButtonBar } from "./ExplorerButtonBar";
//TODO: The margin was set to itself be mindful when replacing by the onyxia-ui version.
import { DirectoryHeader } from "onyxia-ui/DirectoryHeader";
import { useDomRect } from "powerhooks/useDomRect";
import { ExplorerIcon } from "./ExplorerIcon/ExplorerIcon";
import { Dialog } from "onyxia-ui/Dialog";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { Deferred } from "evt/tools/Deferred";
import { useConst } from "powerhooks/useConst";
import type { Equals, Param0 } from "tsafe";
import { TextField } from "onyxia-ui/TextField";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";
import { ExplorerUploadModal } from "./ExplorerUploadModal";
import type { ExplorerUploadModalProps } from "./ExplorerUploadModal";
import { declareComponentKeys } from "i18nifty";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import {
    ListExplorerItems,
    type ListExplorerItemsProps
} from "./ListExplorer/ListExplorerItems";
import type { Item } from "../shared/types";
import { ViewMode } from "../shared/types";
import { isDirectory } from "../shared/tools";
import { ShareDialog } from "../ShareFile/ShareDialog";
import type { ShareView } from "core/usecases/fileExplorer";
import { ExplorerDownloadSnackbar } from "./ExplorerDownloadSnackbar";

export type ExplorerProps = {
    /**
     * For this component to work it must have a fixed width
     * For being able to scroll without moving the button bar it must have a fixed height.
     * */
    className?: string;
    doShowHidden: boolean;

    viewMode: ViewMode;
    onViewModeChange: (params: { viewMode: ViewMode }) => void;
    directoryPath: string;
    isNavigating: boolean;
    commandLogsEntries: CommandBarProps.Entry[] | undefined;
    evtAction: NonPostableEvt<"TRIGGER COPY PATH">;
    items: Item[];
    isBucketPolicyFeatureEnabled: boolean;
    onNavigate: (params: { directoryPath: string }) => void;
    changePolicy: (params: {
        policy: Item["policy"];
        basename: string;
        kind: Item["kind"];
    }) => void;
    onRefresh: () => void;
    onDeleteItem: (params: { item: Item }) => void;
    onDownloadItems: (params: { items: Item[] }) => void;
    onDeleteItems: (params: { items: Item[] }) => void;
    onCreateDirectory: (params: { basename: string }) => void;
    onCopyPath: (params: { path: string }) => void;
    scrollableDivRef: RefObject<any>;
    pathMinDepth: number;
    onOpenFile: (params: { basename: string }) => void;
    shareView: ShareView | undefined;
    onShareFileOpen: (params: { fileBasename: string }) => void;
    onShareFileClose: () => void;
    onShareRequestSignedUrl: () => void;
    onChangeShareSelectedValidityDuration: (params: {
        validityDurationSecond: number;
    }) => void;
    evtIsDownloadSnackbarOpen: StatefulReadonlyEvt<boolean>;
} & Pick<ExplorerUploadModalProps, "onFileSelected" | "filesBeingUploaded">; //NOTE: TODO only defined when explorer type is s3

export const Explorer = memo((props: ExplorerProps) => {
    const {
        className,
        doShowHidden,
        directoryPath,
        isNavigating,
        commandLogsEntries,
        evtAction,
        onNavigate,
        onRefresh,
        onDeleteItem,
        onDeleteItems,
        onCreateDirectory,
        onCopyPath,
        changePolicy,
        onOpenFile,
        scrollableDivRef,
        onFileSelected,
        filesBeingUploaded,
        pathMinDepth,
        onViewModeChange,
        viewMode,
        isBucketPolicyFeatureEnabled,
        shareView,
        onShareFileOpen,
        onShareFileClose,
        onShareRequestSignedUrl,
        onChangeShareSelectedValidityDuration,
        onDownloadItems,
        evtIsDownloadSnackbarOpen
    } = props;

    const [items] = useMemo(
        () => [
            props.items.filter(doShowHidden ? id : obj => !obj.basename.startsWith("."))
        ],
        [props.items, doShowHidden]
    );

    const { t } = useTranslation({ Explorer });

    const [selectedItemKind, setSelectedItemKind] = useState<
        "file" | "directory" | "multiple" | "none"
    >("none");

    const onSelectedItemKindValueChange = useConstCallback(
        ({ selectedItemKind }: Param0<ItemsProps["onSelectedItemKindValueChange"]>) =>
            setSelectedItemKind(selectedItemKind)
    );

    const onBreadcrumbNavigate = useConstCallback(
        ({ upCount }: Param0<BreadcrumbProps["onNavigate"]>) => {
            onNavigate({
                directoryPath: pathJoin(directoryPath, ...new Array(upCount).fill(".."))
            });
        }
    );

    const onItemsNavigate = useConstCallback(
        ({ basename }: Param0<ItemsProps["onNavigate"]>) =>
            onNavigate({
                directoryPath: pathJoin(directoryPath, basename)
            })
    );

    const onItemsPolicyChange = useConstCallback(
        ({ basename, policy, kind }: Param0<ItemsProps["onPolicyChange"]>) =>
            changePolicy({
                basename,
                policy,
                kind
            })
    );

    const onItemsOpenFile = useConstCallback(
        ({ basename }: Param0<ItemsProps["onOpenFile"]>) => {
            onOpenFile({ basename });
        }
    );

    const evtBreadcrumbAction = useConst(() =>
        Evt.create<UnpackEvt<BreadcrumbProps["evtAction"]>>()
    );

    const itemsOnCopyPath = useConstCallback(
        ({ basename }: Parameters<ItemsProps["onCopyPath"]>[0]) => {
            evtBreadcrumbAction.post({
                action: "DISPLAY COPY FEEDBACK",
                basename
            });

            onCopyPath({ path: pathJoin(directoryPath, basename) });
        }
    );

    const onGoBack = useConstCallback(() => {
        onNavigate({ directoryPath: pathJoin(directoryPath, "..") });
    });

    const evtExplorerItemsAction = useConst(() =>
        Evt.create<UnpackEvt<ItemsProps["evtAction"]>>()
    );

    const buttonBarCallback = useConstCallback<ButtonBarProps["callback"]>(buttonId => {
        switch (buttonId) {
            case "refresh":
                onRefresh();
                return;
            case "delete":
                evtExplorerItemsAction.post("DELETE SELECTED ITEM");
                return;
            case "copy path":
                evtExplorerItemsAction.post("COPY SELECTED ITEM PATH");
                return;
            case "create directory":
                setCreateS3DirectoryDialogState({
                    directories: items
                        .filter(isDirectory)
                        .map(({ basename }) => basename),
                    resolveBasename: basename => onCreateDirectory({ basename })
                });
                return;

            case "new":
                setIsUploadModalOpen(true);
                return;
            case "share":
                evtExplorerItemsAction.post("SHARE SELECTED FILE");
                return;
            case "download directory":
                evtExplorerItemsAction.post("DOWNLOAD DIRECTORY");
                return;
        }
        assert<Equals<typeof buttonId, never>>();
    });

    useEvt(
        ctx =>
            evtAction.attach(
                action => action === "TRIGGER COPY PATH",
                ctx,
                () => buttonBarCallback("copy path")
            ),

        [evtAction]
    );

    const { rootRef, buttonBarRef, commandBarTop, commandBarMaxHeight } =
        useCommandBarPositioning();

    const { classes, cx, css, theme } = useStyles({
        ...props,
        commandBarTop
    });

    const [doShowDeletionDialogNextTime, setDoShowDeletionDialogNextTime] =
        useState(true);

    const [deletionDialogState, setDeletionDialogState] = useState<
        | {
              kind: "file" | "directory" | "multiple";
              resolveDoProceedToDeletion: (doProceedToDeletion: boolean) => void;
          }
        | undefined
    >(undefined);

    const [createS3DirectoryDialogState, setCreateS3DirectoryDialogState] =
        useState<CreateS3DirectoryDialogProps["state"]>(undefined);

    const onCreateS3DirectoryDialogClose = useConstCallback(() =>
        setCreateS3DirectoryDialogState(undefined)
    );

    const onDeletionDialogClickFactory = useCallbackFactory(
        ([action]: ["cancel" | "delete"]) => {
            assert(deletionDialogState !== undefined);

            deletionDialogState.resolveDoProceedToDeletion(
                (() => {
                    switch (action) {
                        case "cancel":
                            return false;
                        case "delete":
                            return true;
                    }
                })()
            );
        }
    );

    const itemsOnDeleteItem = useConstCallback(
        async ({ item }: Parameters<ItemsProps["onDeleteItem"]>[0]) => {
            if (doShowDeletionDialogNextTime) {
                const dDoProceedToDeletion = new Deferred();

                setDeletionDialogState({
                    kind: item.kind,
                    resolveDoProceedToDeletion: dDoProceedToDeletion.resolve
                });

                const doProceedToDeletion = await dDoProceedToDeletion.pr;

                setDeletionDialogState(undefined);

                if (!doProceedToDeletion) {
                    return;
                }
            }

            onDeleteItem({ item });
        }
    );

    const itemOnDownloadDirectory = useConstCallback(
        async ({ items }: Parameters<ItemsProps["onDownloadItems"]>[0]) => {
            onDownloadItems({ items });
        }
    );

    const itemsOnDeleteItems = useConstCallback(
        async (
            { items }: Parameters<ListExplorerItemsProps["onDeleteItems"]>[0],
            onDeleteConfirmed?: () => void
        ) => {
            if (doShowDeletionDialogNextTime) {
                const dDoProceedToDeletion = new Deferred();

                setDeletionDialogState({
                    kind: items.length === 1 ? items[0].kind : "multiple",
                    resolveDoProceedToDeletion: dDoProceedToDeletion.resolve
                });

                const doProceedToDeletion = await dDoProceedToDeletion.pr;

                setDeletionDialogState(undefined);

                if (!doProceedToDeletion) {
                    return;
                }
            }

            onDeleteItems({ items });
            onDeleteConfirmed?.();
        }
    );

    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const onUploadModalClose = useConstCallback(() => setIsUploadModalOpen(false));
    const onDragOver = useConstCallback(() => setIsUploadModalOpen(true));

    const onShareDialogOpen = useConstCallback(
        async ({ fileBasename }: Param0<ItemsProps["onShare"]>) => {
            onShareFileOpen({ fileBasename });
        }
    );

    const onShareDialogClose = useConstCallback(() => onShareFileClose());

    return (
        <>
            <div
                ref={rootRef}
                className={cx(classes.root, className)}
                onDragOver={onDragOver}
            >
                <div ref={buttonBarRef}>
                    <ExplorerButtonBar
                        selectedItemKind={selectedItemKind}
                        callback={buttonBarCallback}
                        onViewModeChange={onViewModeChange}
                        viewMode={viewMode}
                    />
                </div>
                {commandLogsEntries !== undefined && (
                    <CommandBar
                        className={classes.commandBar}
                        entries={commandLogsEntries}
                        maxHeight={commandBarMaxHeight}
                    />
                )}

                {(() => {
                    const title = (() => {
                        let split = directoryPath.split("/");

                        // remove the last element
                        split.pop();

                        // remove path min depth elements at the beginning
                        split = split.slice(pathMinDepth + 1);

                        if (split.length === 0) {
                            return undefined;
                        }

                        return split[split.length - 1];
                    })();

                    if (title === undefined) {
                        return null;
                    }

                    return (
                        <DirectoryHeader
                            title={title}
                            onGoBack={onGoBack}
                            subtitle={undefined}
                            image={
                                <ExplorerIcon
                                    className={classes.fileOrDirectoryIcon}
                                    iconId="directory"
                                    hasShadow={true}
                                />
                            }
                        />
                    );
                })()}
                <div className={classes.breadcrumpWrapper}>
                    <Breadcrumb
                        minDepth={pathMinDepth}
                        path={directoryPath.split("/").filter(part => part !== "")}
                        isNavigationDisabled={isNavigating}
                        onNavigate={onBreadcrumbNavigate}
                        evtAction={evtBreadcrumbAction}
                    />
                    {isNavigating && (
                        <CircularProgress
                            color="textPrimary"
                            size={theme.typography.rootFontSizePx}
                            className={classes.circularProgress}
                        />
                    )}
                </div>
                <div
                    ref={scrollableDivRef}
                    className={css({
                        flex: 1,
                        paddingRight: theme.spacing(2),
                        overflow: "auto"
                    })}
                >
                    {(() => {
                        switch (viewMode) {
                            case "block":
                                return (
                                    <ExplorerItems
                                        isNavigating={isNavigating}
                                        items={items}
                                        onNavigate={onItemsNavigate}
                                        onOpenFile={onItemsOpenFile}
                                        onSelectedItemKindValueChange={
                                            onSelectedItemKindValueChange
                                        }
                                        onPolicyChange={onItemsPolicyChange}
                                        onCopyPath={itemsOnCopyPath}
                                        onDeleteItem={itemsOnDeleteItem}
                                        onShare={onShareDialogOpen}
                                        evtAction={evtExplorerItemsAction}
                                        isBucketPolicyFeatureEnabled={
                                            isBucketPolicyFeatureEnabled
                                        }
                                        onDownloadItems={itemOnDownloadDirectory}
                                    />
                                );
                            case "list":
                                return (
                                    <ListExplorerItems
                                        isNavigating={isNavigating}
                                        items={items}
                                        onNavigate={onItemsNavigate}
                                        onOpenFile={onItemsOpenFile}
                                        onSelectedItemKindValueChange={
                                            onSelectedItemKindValueChange
                                        }
                                        onPolicyChange={onItemsPolicyChange}
                                        onCopyPath={itemsOnCopyPath}
                                        onDeleteItems={itemsOnDeleteItems}
                                        onShare={onShareDialogOpen}
                                        evtAction={evtExplorerItemsAction}
                                        isBucketPolicyFeatureEnabled={
                                            isBucketPolicyFeatureEnabled
                                        }
                                        onDownloadItems={itemOnDownloadDirectory}
                                    />
                                );
                        }
                        assert<Equals<typeof viewMode, never>>();
                    })()}
                </div>
            </div>
            <CreateS3DirectoryDialog
                state={createS3DirectoryDialogState}
                onClose={onCreateS3DirectoryDialogClose}
            />
            <Dialog
                {...(() => {
                    const deleteWhat =
                        deletionDialogState === undefined
                            ? ""
                            : t(deletionDialogState.kind);
                    const isPlural =
                        deletionDialogState === undefined
                            ? false
                            : deletionDialogState.kind === "multiple";

                    return {
                        title: t("deletion dialog title", { deleteWhat, isPlural }),
                        body: t("deletion dialog body", { deleteWhat, isPlural })
                    };
                })()}
                isOpen={deletionDialogState !== undefined}
                onClose={onDeletionDialogClickFactory("cancel")}
                doNotShowNextTimeText={t("do not display again")}
                onDoShowNextTimeValueChange={setDoShowDeletionDialogNextTime}
                buttons={
                    <>
                        <Button
                            variant="secondary"
                            onClick={onDeletionDialogClickFactory("cancel")}
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            autoFocus
                            onClick={onDeletionDialogClickFactory("delete")}
                        >
                            {t("delete")}
                        </Button>
                    </>
                }
            />

            <ShareDialog
                shareView={shareView}
                onChangeShareSelectedValidityDuration={
                    onChangeShareSelectedValidityDuration
                }
                onClose={onShareDialogClose}
                onRequestUrl={onShareRequestSignedUrl}
            />

            <ExplorerUploadModal
                isOpen={isUploadModalOpen}
                onClose={onUploadModalClose}
                onFileSelected={onFileSelected}
                filesBeingUploaded={filesBeingUploaded}
            />

            <ExplorerDownloadSnackbar evtIsOpen={evtIsDownloadSnackbarOpen} />
        </>
    );
});

const { i18n } = declareComponentKeys<
    | { K: "untitled what"; P: { what: string } }
    | "directory"
    | "file"
    | "multiple"
    | "secret"
    | "cancel"
    | "delete"
    | { K: "deletion dialog title"; P: { deleteWhat: string; isPlural: boolean } }
    | { K: "deletion dialog body"; P: { deleteWhat: string; isPlural: boolean } }
    | "do not display again"
    | "already a directory with this name"
    | "can't be empty"
    | "create"
    | "new directory"
>()({ Explorer });
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<{
        commandBarTop: number;
    }>()
    .withName({ Explorer })
    .create(({ theme, commandBarTop }) => ({
        root: {
            position: "relative",
            display: "flex",
            flexDirection: "column"
        },
        commandBar: {
            position: "absolute",
            right: 0,
            width: "40%",
            top: commandBarTop,
            zIndex: 1,
            opacity: commandBarTop === 0 ? 0 : 1,
            transition: "opacity 750ms linear"
        },
        breadcrumpWrapper: {
            marginTop: theme.spacing(3),
            marginBottom: theme.spacing(4),
            display: "flex",
            alignItems: "center"
        },
        circularProgress: {
            marginLeft: theme.spacing(2)
        },
        fileOrDirectoryIcon: {
            height: "unset",
            width: "100%"
        }
    }));

function useCommandBarPositioning() {
    const {
        domRect: { bottom: rootBottom },
        ref: rootRef
    } = useDomRect();

    // NOTE: To avoid https://reactjs.org/docs/hooks-reference.html#useimperativehandle
    const {
        domRect: { height: buttonBarHeight, bottom: buttonBarBottom },
        ref: buttonBarRef
    } = useDomRect();

    const [commandBarTop, setCommandBarTop] = useState<number>(0);

    const [commandBarMaxHeight, setCommandBarMaxHeight] = useState<number>(0);

    useEffect(() => {
        setCommandBarTop(buttonBarHeight);

        setCommandBarMaxHeight(rootBottom - buttonBarBottom - 30);
    }, [buttonBarHeight, buttonBarBottom, rootBottom]);

    return {
        rootRef,
        buttonBarRef,
        commandBarTop,
        commandBarMaxHeight
    };
}

type CreateS3DirectoryDialogProps = {
    state:
        | {
              directories: string[];
              resolveBasename: (basename: string) => void;
          }
        | undefined;
    onClose: () => void;
};

const { CreateS3DirectoryDialog } = (() => {
    const CreateS3DirectoryDialog = memo((props: CreateS3DirectoryDialogProps) => {
        const { state, onClose } = props;

        const evtResolve = useConst(() =>
            Evt.create<UnpackEvt<ButtonsProps["evtResolve"]>>(null)
        );

        const onResolveFunctionChanged = useConstCallback<
            BodyProps["onResolveFunctionChanged"]
        >(({ resolve }) => (evtResolve.state = resolve));

        const { t } = useTranslation({ Explorer });

        return (
            <Dialog
                title={t("new directory")}
                body={
                    state && (
                        <Body
                            onClose={onClose}
                            onResolveFunctionChanged={onResolveFunctionChanged}
                            {...state}
                        />
                    )
                }
                isOpen={state !== undefined}
                onClose={onClose}
                buttons={<Buttons evtResolve={evtResolve} onClose={onClose} />}
            />
        );
    });

    type BodyProps = {
        directories: string[];
        onClose: CreateS3DirectoryDialogProps["onClose"];
        resolveBasename: (basename: string) => void;
        onResolveFunctionChanged: (params: { resolve: (() => void) | null }) => void;
    };

    const Body = memo((props: BodyProps) => {
        const { directories, onClose, resolveBasename, onResolveFunctionChanged } = props;

        const { classes } = useStyles();

        const { t } = useTranslation({ Explorer });

        const getIsValidValue = useConstCallback<TextFieldProps["getIsValidValue"]>(
            text => {
                if (text === "") {
                    return {
                        isValidValue: false,
                        message: t("can't be empty")
                    };
                }

                if (directories.includes(text)) {
                    return {
                        isValidValue: false,
                        message: t("already a directory with this name")
                    };
                }

                return {
                    isValidValue: true
                };
            }
        );

        const [{ resolve }, setResolve] = useState<{ resolve: (() => void) | null }>({
            resolve: null
        });

        const onValueBeingTypedChange = useConstCallback<
            TextFieldProps["onValueBeingTypedChange"]
        >(({ value, isValidValue }) =>
            setResolve({
                resolve: isValidValue
                    ? () => {
                          resolveBasename(value);
                          onClose();
                      }
                    : null
            })
        );

        useEffect(() => {
            onResolveFunctionChanged({ resolve });
        }, [resolve]);

        const suggestedBasename = useMemo(
            () =>
                generateUniqDefaultName({
                    names: directories,
                    buildName: buildNameFactory({
                        defaultName: t("untitled what", {
                            what: t("directory")
                        }),
                        separator: "_"
                    })
                }),
            [directories, t]
        );

        const evtAction = useConst(() =>
            Evt.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>()
        );

        const onEnterKeyDown = useConstCallback<TextFieldProps["onEnterKeyDown"]>(
            ({ preventDefaultAndStopPropagation }) => {
                preventDefaultAndStopPropagation();
                evtAction.post("TRIGGER SUBMIT");
            }
        );

        const onSubmit = useConstCallback<TextFieldProps["onSubmit"]>(() => {
            assert(resolve !== null);
            resolve();
        });

        return (
            <TextField
                inputProps_autoFocus={true}
                selectAllTextOnFocus={true}
                className={classes.textField}
                defaultValue={suggestedBasename}
                getIsValidValue={getIsValidValue}
                onValueBeingTypedChange={onValueBeingTypedChange}
                evtAction={evtAction}
                onEnterKeyDown={onEnterKeyDown}
                onSubmit={onSubmit}
            />
        );
    });

    type ButtonsProps = {
        onClose: CreateS3DirectoryDialogProps["onClose"];
        evtResolve: StatefulReadonlyEvt<(() => void) | null>;
    };

    const Buttons = memo((props: ButtonsProps) => {
        const { onClose, evtResolve } = props;

        const { t } = useTranslation({ Explorer });

        useRerenderOnStateChange(evtResolve);

        return (
            <>
                <Button variant="secondary" onClick={onClose}>
                    {t("cancel")}
                </Button>
                <Button
                    onClick={evtResolve.state ?? undefined}
                    disabled={evtResolve.state === null}
                >
                    {t("create")}
                </Button>
            </>
        );
    });

    const useStyles = tss.withName({ CreateS3DirectoryDialog }).create(({ theme }) => ({
        textField: {
            width: 250,
            margin: theme.spacing(5)
        }
    }));

    return { CreateS3DirectoryDialog };
})();
