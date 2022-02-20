import type { ReactNode } from "react";
import { makeStyles, Button } from "ui/theme";
import { useState, useEffect, useMemo, memo } from "react";
import type { RefObject } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { ExplorerItemsProps as ItemsProps } from "./ExplorerItems/ExplorerItems";
import { Breadcrump } from "onyxia-ui/Breadcrump";
import type { BreadcrumpProps } from "onyxia-ui/Breadcrump";
import { Props as ButtonBarProps } from "./ExplorerButtonBar";
import { Evt } from "evt";
import { join as pathJoin, basename as pathBasename } from "path";
import type { UnpackEvt } from "evt";
import { useTranslation } from "ui/i18n/useTranslations";
import { ApiLogsBar } from "./ApiLogsBar";
import {
    generateUniqDefaultName,
    buildNameFactory,
} from "ui/tools/generateUniqDefaultName";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";

import { ExplorerItems } from "./ExplorerItems";
import { ExplorerButtonBar } from "./ExplorerButtonBar";
//TODO: The margin was set to itself be mindful when replacing by the onyxia-ui version.
import { DirectoryHeader } from "onyxia-ui/DirectoryHeader";
import { useDomRect } from "onyxia-ui";
import { FileOrDirectoryIcon } from "./FileOrDirectoryIcon";
import { getFormattedDate } from "ui/i18n/useMoment";
import { Dialog } from "onyxia-ui/Dialog";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { Deferred } from "evt/tools/Deferred";
import type { ApiLogs } from "core/tools/apiLogger";
import { useConst } from "powerhooks/useConst";
import type { Param0 } from "tsafe";
import { useLng } from "ui/i18n/useLng";
import { Card } from "onyxia-ui/Card";

export type ExplorerProps = {
    /**
     * For this component to work it must have a fixed width
     * For being able to scroll without moving the button bar it must have a fixed height.
     * */
    className?: string;
    explorerType: "s3" | "secrets";
    doShowHidden: boolean;

    directoryPath: string;
    isNavigating: boolean;
    apiLogs: ApiLogs;
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
    //NOTE: It can be a request to upload a file or crating a new secret
    onNewItem: (params: {
        kind: "file" | "directory";
        suggestedBasename: string;
    }) => void;
    onCopyPath: (params: { path: string }) => void;
    //Defines how hight users should be allowed to browse up in the path
    pathMinDepth: number;
    //TODO: Find a better way
    scrollableDivRef: RefObject<any>;
} & (
    | {
          isFileOpen: true;
          openFileTime: number;
          openFileNode: ReactNode;
          onCloseFile: () => void;
      }
    | {
          isFileOpen: false;
          onOpenFile: (params: { basename: string }) => void;
      }
);

export const Explorer = memo((props: ExplorerProps) => {
    const {
        className,
        explorerType,
        doShowHidden,
        directoryPath,
        isNavigating,
        apiLogs,
        evtAction,
        onNavigate,
        onRefresh,
        onEditBasename,
        onDeleteItem,
        onNewItem,
        onCopyPath,
        scrollableDivRef,
        pathMinDepth,
    } = props;

    const [
        files,
        directories,
        directoriesBeingCreated,
        directoriesBeingRenamed,
        filesBeingCreated,
        filesBeingRenamed,
    ] = useMemo(
        () =>
            (
                [
                    props.files,
                    props.directories,
                    props.directoriesBeingCreated,
                    props.directoriesBeingRenamed,
                    props.filesBeingCreated,
                    props.filesBeingRenamed,
                ] as const
            ).map(
                doShowHidden
                    ? id
                    : arr => arr.filter(basename => !basename.startsWith(".")),
            ),
        [
            props.files,
            props.directories,
            props.directoriesBeingCreated,
            props.directoriesBeingRenamed,
            props.filesBeingCreated,
            props.filesBeingRenamed,
            doShowHidden,
        ],
    );

    const { t } = useTranslation({ Explorer });

    const [selectedItemKind, setSelectedItemKind] = useState<
        "file" | "directory" | "none"
    >("none");

    const onSelectedItemKindValueChange = useConstCallback(
        ({ selectedItemKind }: Param0<ItemsProps["onSelectedItemKindValueChange"]>) =>
            setSelectedItemKind(selectedItemKind),
    );

    const [isSelectedItemInEditingState, setIsSelectedItemInEditingState] =
        useState(false);

    const onIsSelectedItemInEditingStateValueChange = useConstCallback(
        ({
            isSelectedItemInEditingState,
        }: Param0<ItemsProps["onIsSelectedItemInEditingStateValueChange"]>) =>
            setIsSelectedItemInEditingState(isSelectedItemInEditingState),
    );

    const onBreadcrumpNavigate = useConstCallback(
        ({ upCount }: Param0<BreadcrumpProps["onNavigate"]>) => {
            onNavigate({
                "directoryPath": pathJoin(...new Array(upCount).fill("..")),
            });
        },
    );

    const onItemsNavigate = useConstCallback(
        ({ basename }: Param0<ItemsProps["onNavigate"]>) =>
            onNavigate({
                "directoryPath": pathJoin(directoryPath, basename),
            }),
    );

    const onItemsOpenFile = useConstCallback(
        ({ basename }: Param0<ItemsProps["onOpenFile"]>) => {
            assert(!props.isFileOpen);

            props.onOpenFile({ basename });
        },
    );

    const evtBreadcrumpAction = useConst(() =>
        Evt.create<UnpackEvt<BreadcrumpProps["evtAction"]>>(),
    );

    const itemsOnCopyPath = useConstCallback(
        ({ basename }: Parameters<ItemsProps["onCopyPath"]>[0]) => {
            evtBreadcrumpAction.post({
                "action": "DISPLAY COPY FEEDBACK",
                "basename": basename === "." ? undefined : basename,
            });

            onCopyPath({ "path": pathJoin(directoryPath, basename) });
        },
    );

    const onGoBack = useConstCallback(() =>
        onNavigate({ "directoryPath": pathJoin(directoryPath, "..") }),
    );

    const { evtItemsAction } = useConst(() => ({
        "evtItemsAction": Evt.create<UnpackEvt<ItemsProps["evtAction"]>>(),
    }));

    const buttonBarCallback = useConstCallback<ButtonBarProps["callback"]>(buttonId => {
        switch (buttonId) {
            case "refresh":
                if (props.isFileOpen) {
                    alert("TODO");
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
                    itemsOnCopyPath({ "basename": "." });
                    break;
                }

                evtItemsAction.post("COPY SELECTED ITEM PATH");
                break;
            case "create directory":
                onNewItem({
                    "kind": "directory" as const,
                    "suggestedBasename": generateUniqDefaultName({
                        "names": directories,
                        "buildName": buildNameFactory({
                            "defaultName": t("untitled what", {
                                "what": t("directory"),
                            }),
                            "separator": "_",
                        }),
                    }),
                });
                break;
            case "new":
                onNewItem({
                    "kind": "file" as const,
                    "suggestedBasename": generateUniqDefaultName({
                        "names": files,
                        "buildName": buildNameFactory({
                            "defaultName": t("untitled what", {
                                "what": t(
                                    (() => {
                                        switch (explorerType) {
                                            case "s3":
                                                return "file";
                                            case "secrets":
                                                return "secret";
                                        }
                                    })(),
                                ),
                            }),
                            "separator": "_",
                        }),
                    }),
                });
                break;
        }
    });

    useEvt(
        ctx =>
            evtAction.attach(
                action => action === "TRIGGER COPY PATH",
                ctx,
                () => buttonBarCallback("copy path"),
            ),

        [evtAction],
    );

    const { rootRef, buttonBarRef, cmdTranslationTop, cmdTranslationMaxHeight } =
        useApiLogsBarPositioning();

    const { classes, cx, css, theme } = useStyles({
        ...props,
        cmdTranslationTop,
    });

    const { formattedDate } = (function useClosure() {
        const { lng } = useLng();

        const formattedDate = !props.isFileOpen
            ? undefined
            : getFormattedDate({ "time": props.openFileTime, lng });

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
                })(),
            );
        },
    );

    const itemsOnDeleteItem = useConstCallback(
        async ({ kind, basename }: Parameters<ItemsProps["onDeleteItem"]>[0]) => {
            if (doShowDeletionDialogNextTime) {
                const dDoProceedToDeletion = new Deferred();

                setDeletionDialogState({
                    kind,
                    basename,
                    "resolveDoProceedToDeletion": dDoProceedToDeletion.resolve,
                });

                const doProceedToDeletion = await dDoProceedToDeletion.pr;

                setDeletionDialogState(undefined);

                if (!doProceedToDeletion) {
                    return;
                }
            }

            onDeleteItem({ kind, basename });
        },
    );

    return (
        <>
            <div ref={rootRef} className={cx(classes.root, className)}>
                <div ref={buttonBarRef}>
                    <ExplorerButtonBar
                        explorerType={explorerType}
                        selectedItemKind={selectedItemKind}
                        isSelectedItemInEditingState={isSelectedItemInEditingState}
                        isFileOpen={props.isFileOpen}
                        callback={buttonBarCallback}
                    />
                </div>
                <ApiLogsBar
                    className={classes.cmdTranslation}
                    apiLogs={apiLogs}
                    maxHeight={cmdTranslationMaxHeight}
                />
                {directoryPath.split("/").length === pathMinDepth ? null : (
                    <DirectoryHeader
                        title={pathBasename(directoryPath)}
                        onGoBack={onGoBack}
                        subtitle={formattedDate}
                        image={
                            <FileOrDirectoryIcon
                                explorerType={explorerType}
                                standardizedWidth="big"
                                kind={props.isFileOpen ? "file" : "directory"}
                            />
                        }
                    />
                )}
                <Breadcrump
                    className={classes.breadcrump}
                    minDepth={pathMinDepth}
                    path={directoryPath.split("/")}
                    isNavigationDisabled={isNavigating}
                    onNavigate={onBreadcrumpNavigate}
                    evtAction={evtBreadcrumpAction}
                />
                <div
                    ref={scrollableDivRef}
                    className={cx(
                        css({
                            "flex": 1,
                            "paddingRight": theme.spacing(2),
                            "overflow": "auto",
                        }),
                    )}
                >
                    {props.isFileOpen ? (
                        <Card>{props.openFileNode}</Card>
                    ) : (
                        <ExplorerItems
                            explorerType={explorerType}
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
                                              return (() => {
                                                  switch (explorerType) {
                                                      case "s3":
                                                          return "file";
                                                      case "secrets":
                                                          return "secret";
                                                  }
                                              })();
                                      }
                                  })(),
                              );

                    return {
                        "title": t("deletion dialog title", { deleteWhat }),
                        "body": t("deletion dialog body", { deleteWhat }),
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
export declare namespace Explorer {
    export type I18nScheme = {
        "untitled what": { what: string };
        directory: undefined;
        file: undefined;
        secret: undefined;
        cancel: undefined;
        delete: undefined;
        "deletion dialog title": { deleteWhat: string };
        "deletion dialog body": { deleteWhat: string };
        "do not display again": undefined;
    };
}

const useStyles = makeStyles<{ cmdTranslationTop: number }>({ "name": { Explorer } })(
    (theme, { cmdTranslationTop }) => ({
        "root": {
            "position": "relative",
            "display": "flex",
            "flexDirection": "column",
        },
        "cmdTranslation": {
            "position": "absolute",
            "right": 0,
            "width": "40%",
            "top": cmdTranslationTop,
            "zIndex": 1,
            "opacity": cmdTranslationTop === 0 ? 0 : 1,
            "transition": "opacity 750ms linear",
        },
        "breadcrump": {
            "marginTop": theme.spacing(3),
            "marginBottom": theme.spacing(4),
        },
    }),
);

function useApiLogsBarPositioning() {
    const {
        domRect: { bottom: rootBottom },
        ref: rootRef,
    } = useDomRect();

    // NOTE: To avoid https://reactjs.org/docs/hooks-reference.html#useimperativehandle
    const {
        domRect: { height: buttonBarHeight, bottom: buttonBarBottom },
        ref: buttonBarRef,
    } = useDomRect();

    const [cmdTranslationTop, setCmdTranslationTop] = useState<number>(0);

    const [cmdTranslationMaxHeight, setCmdTranslationMaxHeight] = useState<number>(0);

    useEffect(() => {
        setCmdTranslationTop(buttonBarHeight);

        setCmdTranslationMaxHeight(rootBottom - buttonBarBottom - 30);
    }, [buttonBarHeight, buttonBarBottom, rootBottom]);

    return {
        rootRef,
        buttonBarRef,
        cmdTranslationTop,
        cmdTranslationMaxHeight,
    };
}
