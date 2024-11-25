import type { ReactNode } from "react";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { useState, useEffect, useMemo, memo } from "react";
import type { RefObject } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { SecretsExplorerItemsProps as ItemsProps } from "./SecretsExplorerItems/SecretsExplorerItems";
import { Breadcrumb } from "onyxia-ui/Breadcrumb";
import type { BreadcrumbProps } from "onyxia-ui/Breadcrumb";
import { Props as ButtonBarProps } from "./SecretsExplorerButtonBar";
import { Evt } from "evt";
import { join as pathJoin, basename as pathBasename } from "pathe";
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
import { SecretsExplorerItems } from "./SecretsExplorerItems";
import { SecretsExplorerButtonBar } from "./SecretsExplorerButtonBar";
//TODO: The margin was set to itself be mindful when replacing by the onyxia-ui version.
import { DirectoryHeader } from "onyxia-ui/DirectoryHeader";
import { useDomRect } from "powerhooks/useDomRect";
import { ExplorerIcon } from "./ExplorerIcon";
import { getFormattedDate } from "ui/tools/useFormattedDate";
import { Dialog } from "onyxia-ui/Dialog";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { Deferred } from "evt/tools/Deferred";
import { useConst } from "powerhooks/useConst";
import type { Param0 } from "tsafe";
import { useLang } from "ui/i18n";
import { Card } from "onyxia-ui/Card";
import { TextField } from "onyxia-ui/TextField";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";
import { declareComponentKeys } from "i18nifty";
import { CircularProgress } from "onyxia-ui/CircularProgress";

export type ExplorerProps = {
    /**
     * For this component to work it must have a fixed width
     * For being able to scroll without moving the button bar it must have a fixed height.
     * */
    className?: string;
    doShowHidden: boolean;

    directoryPath: string;
    isNavigating: boolean;
    commandLogsEntries: CommandBarProps.Entry[];
    evtAction: NonPostableEvt<"TRIGGER COPY PATH">;
    files: string[];
    directories: string[];
    directoriesBeingCreated: string[];
    directoriesBeingRenamed: string[];
    filesBeingCreated: string[];
    filesBeingRenamed: string[];
    onNavigate: (params: { directoryPath: string }) => void;
    onRefresh: () => void;
    onEditBasename: (params: {
        kind: "file" | "directory";
        basename: string;
        newBasename: string;
    }) => void;
    onDeleteItem: (params: { kind: "file" | "directory"; basename: string }) => void;
    onNewItem: (params: {
        kind: "file" | "directory";
        suggestedBasename: string;
    }) => void;
    onCopyPath: (params: { path: string }) => void;
    //TODO: Find a better way
    scrollableDivRef: RefObject<any>;
    isCommandBarEnabled: boolean;
} & (
    | {
          isFileOpen: true;
          openFileBasename: string;
          /** Undefined when file is loading
           * TODO: Add a new state when file is opening, onClose and onRefresh should
           * not be clickable.
           */
          openFileTime: number | undefined;
          openFileNode: ReactNode;
          onCloseFile: () => void;
          onRefreshOpenFile: () => void;
      }
    | {
          isFileOpen: false;
          onOpenFile: (params: { basename: string }) => void;
      }
);

export const SecretsExplorer = memo((props: ExplorerProps) => {
    const {
        className,
        doShowHidden,
        directoryPath,
        isNavigating,
        commandLogsEntries,
        evtAction,
        onNavigate,
        onRefresh,
        onEditBasename,
        onDeleteItem,
        onNewItem,
        onCopyPath,
        scrollableDivRef,
        isCommandBarEnabled
    } = props;

    const [
        files,
        directories,
        directoriesBeingCreated,
        directoriesBeingRenamed,
        filesBeingCreated,
        filesBeingRenamed
    ] = useMemo(
        () =>
            (
                [
                    props.files,
                    props.directories,
                    props.directoriesBeingCreated,
                    props.directoriesBeingRenamed,
                    props.filesBeingCreated,
                    props.filesBeingRenamed
                ] as const
            ).map(
                doShowHidden
                    ? id
                    : arr => arr.filter(basename => !basename.startsWith("."))
            ),
        [
            props.files,
            props.directories,
            props.directoriesBeingCreated,
            props.directoriesBeingRenamed,
            props.filesBeingCreated,
            props.filesBeingRenamed,
            doShowHidden
        ]
    );

    const { t } = useTranslation({ SecretsExplorer });

    const [selectedItemKind, setSelectedItemKind] = useState<
        "file" | "directory" | "none"
    >("none");

    const onSelectedItemKindValueChange = useConstCallback(
        ({ selectedItemKind }: Param0<ItemsProps["onSelectedItemKindValueChange"]>) =>
            setSelectedItemKind(selectedItemKind)
    );

    const [isSelectedItemInEditingState, setIsSelectedItemInEditingState] =
        useState(false);

    const onIsSelectedItemInEditingStateValueChange = useConstCallback(
        ({
            isSelectedItemInEditingState
        }: Param0<ItemsProps["onIsSelectedItemInEditingStateValueChange"]>) =>
            setIsSelectedItemInEditingState(isSelectedItemInEditingState)
    );

    const onBreadcrumbNavigate = useConstCallback(
        ({ upCount }: Param0<BreadcrumbProps["onNavigate"]>) => {
            onNavigate({
                directoryPath: pathJoin(
                    directoryPath,
                    ...new Array(upCount - (props.isFileOpen ? 1 : 0)).fill("..")
                )
            });
        }
    );

    const onItemsNavigate = useConstCallback(
        ({ basename }: Param0<ItemsProps["onNavigate"]>) =>
            onNavigate({
                directoryPath: pathJoin(directoryPath, basename)
            })
    );

    const onItemsOpenFile = useConstCallback(
        ({ basename }: Param0<ItemsProps["onOpenFile"]>) => {
            assert(!props.isFileOpen);

            props.onOpenFile({ basename });
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
        if (props.isFileOpen) {
            props.onCloseFile();
        } else {
            onNavigate({ directoryPath: pathJoin(directoryPath, "..") });
        }
    });

    const { evtItemsAction } = useConst(() => ({
        evtItemsAction: Evt.create<UnpackEvt<ItemsProps["evtAction"]>>()
    }));

    const buttonBarCallback = useConstCallback<ButtonBarProps["callback"]>(buttonId => {
        switch (buttonId) {
            case "refresh":
                if (props.isFileOpen) {
                    props.onRefreshOpenFile();
                } else {
                    onRefresh();
                }
                break;
            case "rename":
                evtItemsAction.post("START EDITING SELECTED ITEM BASENAME");
                break;
            case "delete":
                evtItemsAction.post("DELETE SELECTED ITEM");
                break;
            case "copy path":
                if (props.isFileOpen) {
                    evtBreadcrumbAction.post({ action: "DISPLAY COPY FEEDBACK" });

                    onCopyPath({
                        path: pathJoin(directoryPath, props.openFileBasename)
                    });
                } else {
                    evtItemsAction.post("COPY SELECTED ITEM PATH");
                }
                break;
            case "create directory":
                onNewItem({
                    kind: "directory",
                    suggestedBasename: generateUniqDefaultName({
                        names: directories,
                        buildName: buildNameFactory({
                            defaultName: t("untitled what", {
                                what: t("directory")
                            }),
                            separator: "_"
                        })
                    })
                });
                break;
            case "new":
                onNewItem({
                    kind: "file" as const,
                    suggestedBasename: generateUniqDefaultName({
                        names: files,
                        buildName: buildNameFactory({
                            defaultName: t("untitled what", {
                                what: t("secret")
                            }),
                            separator: "_"
                        })
                    })
                });
                break;
        }
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
        commandBarTop,
        isOpenFileNodeNull: !props.isFileOpen ? true : props.openFileNode === null
    });

    const { formattedDate } = (function useClosure() {
        // NOTE: For enforcing refresh if lang is changed
        useLang();

        const formattedDate = !props.isFileOpen ? undefined : props.openFileTime ===
          undefined ? (
            <>&nbsp;</>
        ) : (
            getFormattedDate({ time: props.openFileTime })
        );

        return { formattedDate };
    })();

    const [doShowDeletionDialogNextTime, setDoShowDeletionDialogNextTime] =
        useState(true);

    const [deletionDialogState, setDeletionDialogState] = useState<
        | {
              kind: "file" | "directory";
              basename: string;
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
        async ({ kind, basename }: Parameters<ItemsProps["onDeleteItem"]>[0]) => {
            if (doShowDeletionDialogNextTime) {
                const dDoProceedToDeletion = new Deferred();

                setDeletionDialogState({
                    kind,
                    basename,
                    resolveDoProceedToDeletion: dDoProceedToDeletion.resolve
                });

                const doProceedToDeletion = await dDoProceedToDeletion.pr;

                setDeletionDialogState(undefined);

                if (!doProceedToDeletion) {
                    return;
                }
            }

            onDeleteItem({ kind, basename });
        }
    );

    return (
        <>
            <div ref={rootRef} className={cx(classes.root, className)}>
                <div ref={buttonBarRef}>
                    <SecretsExplorerButtonBar
                        selectedItemKind={selectedItemKind}
                        isSelectedItemInEditingState={isSelectedItemInEditingState}
                        isFileOpen={props.isFileOpen}
                        callback={buttonBarCallback}
                    />
                </div>
                {isCommandBarEnabled && (
                    <CommandBar
                        className={classes.commandBar}
                        entries={commandLogsEntries}
                        maxHeight={commandBarMaxHeight}
                    />
                )}
                {(() => {
                    const title = (() => {
                        if (props.isFileOpen) {
                            return props.openFileBasename;
                        }

                        const split = directoryPath
                            .split("/")
                            .filter(part => part !== "");

                        assert(
                            split.length !== 0,
                            "We assume there is always a directory for the user (or project)"
                        );

                        if (split.length === 1) {
                            return undefined;
                        }

                        return pathBasename(directoryPath);
                    })();

                    if (title === undefined) {
                        return null;
                    }

                    return (
                        <DirectoryHeader
                            title={title}
                            onGoBack={onGoBack}
                            subtitle={formattedDate}
                            image={
                                <ExplorerIcon
                                    className={classes.fileOrDirectoryIcon}
                                    iconId={!props.isFileOpen ? "directory" : "secret"}
                                    hasShadow={true}
                                />
                            }
                        />
                    );
                })()}
                <div className={classes.breadcrumpWrapper}>
                    <Breadcrumb
                        path={[
                            ...directoryPath.split("/"),
                            ...(props.isFileOpen ? [props.openFileBasename] : [])
                        ]}
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
                    className={cx(
                        css({
                            flex: 1,
                            paddingRight: theme.spacing(2),
                            overflow: "auto"
                        })
                    )}
                >
                    {props.isFileOpen ? (
                        <Card className={classes.openFile}>{props.openFileNode}</Card>
                    ) : (
                        <SecretsExplorerItems
                            isNavigating={isNavigating}
                            files={files}
                            directories={directories}
                            directoriesBeingCreated={directoriesBeingCreated}
                            directoriesBeingRenamed={directoriesBeingRenamed}
                            filesBeingCreated={filesBeingCreated}
                            filesBeingRenamed={filesBeingRenamed}
                            onNavigate={onItemsNavigate}
                            onOpenFile={onItemsOpenFile}
                            onEditBasename={onEditBasename}
                            onSelectedItemKindValueChange={onSelectedItemKindValueChange}
                            onIsSelectedItemInEditingStateValueChange={
                                onIsSelectedItemInEditingStateValueChange
                            }
                            onCopyPath={itemsOnCopyPath}
                            onDeleteItem={itemsOnDeleteItem}
                            evtAction={evtItemsAction}
                        />
                    )}
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
                            : t(
                                  (() => {
                                      switch (deletionDialogState.kind) {
                                          case "directory":
                                              return "directory";
                                          case "file":
                                              return "secret";
                                      }
                                  })()
                              );

                    return {
                        title: t("deletion dialog title", { deleteWhat }),
                        body: t("deletion dialog body", { deleteWhat })
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
        </>
    );
});

const { i18n } = declareComponentKeys<
    | { K: "untitled what"; P: { what: string } }
    | "directory"
    | "file"
    | "secret"
    | "cancel"
    | "delete"
    | { K: "deletion dialog title"; P: { deleteWhat: string } }
    | { K: "deletion dialog body"; P: { deleteWhat: string } }
    | "do not display again"
    | "already a directory with this name"
    | "can't be empty"
    | "create"
    | "new directory"
>()({ SecretsExplorer });
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<{
        commandBarTop: number;
        isOpenFileNodeNull: boolean;
    }>()
    .withName({ SecretsExplorer })
    .create(({ theme, commandBarTop, isOpenFileNodeNull }) => ({
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
        openFile: (() => {
            const opacity = isOpenFileNodeNull ? 0 : 1;

            return {
                opacity,
                transition: opacity === 0 ? undefined : "opacity 500ms linear"
            };
        })(),
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

        const { t } = useTranslation({ SecretsExplorer });

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

        const { t } = useTranslation({ SecretsExplorer });

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

        const { t } = useTranslation({ SecretsExplorer });

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
