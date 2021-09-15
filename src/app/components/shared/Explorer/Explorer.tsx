import { makeStyles, Button } from "app/theme";
import { useState, useEffect, useMemo, memo } from "react";
import type { RefObject } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { Props as ItemsProps } from "./ExplorerItems";
import { Breadcrump } from "onyxia-ui/Breadcrump";
import type { BreadcrumpProps } from "onyxia-ui/Breadcrump";
import { Props as ButtonBarProps } from "./ExplorerButtonBar";
import { Evt } from "evt";
import {
    join as pathJoin,
    basename as pathBasename,
    relative as pathRelative,
} from "path";
import type { UnpackEvt } from "evt";
import { useTranslation } from "app/i18n/useTranslations";
import type { Props as CmdTranslationProps } from "./CmdTranslation";
import { CmdTranslation } from "./CmdTranslation";
import {
    generateUniqDefaultName,
    buildNameFactory,
} from "app/tools/generateUniqDefaultName";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { Card } from "onyxia-ui/Card";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";

import { ExplorerItems as PolymorphExplorerItems } from "./ExplorerItems";
import { ExplorerButtonBar as PolymorphExplorerButtonBar } from "./ExplorerButtonBar";
//TODO: The margin was set to itself be mindful when replacing by the onyxia-ui version.
import { DirectoryHeader } from "onyxia-ui/DirectoryHeader";
import { useDomRect } from "onyxia-ui";
import { getPathDepth } from "app/tools/getPathDepth";
import { useWithProps } from "powerhooks/useWithProps";
import { FileOrDirectoryIcon } from "./FileOrDirectoryIcon";
import { useFormattedDate } from "app/i18n/useMoment";
import { Dialog } from "onyxia-ui/Dialog";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { Deferred } from "evt/tools/Deferred";

export type ExplorerProps = {
    /** [HIGHER ORDER] */
    useCase: "secret" | "file";
    /** [HIGHER ORDER] */
    getIsValidBasename(params: { basename: string }): boolean;

    /**
     * For this component to work it must have a fixed width
     * For being able to scroll without moving the button bar it must have a fixed height.
     * */
    className: string;

    evtTranslation: CmdTranslationProps["evtTranslation"];

    evtAction: NonPostableEvt<"TRIGGER COPY PATH">;

    /**
     * To provide user from browsing to ride to far up in the tree.
     * For example by providing:
     * browsablePath: "/a/b"
     * currentPath: "/a/b/c/foo.txt"
     * The breadcrumb will display /a/b/c/foo.txt but will not let user click
     * on "/", "a/" or "b/", only "c/"
     *
     * If currentPath is relative, we expect browsablePath to be relative as well.
     */
    browsablePath: string;

    currentPath: string;
    isNavigating: boolean;
    file: React.ReactNode;

    /** Date that will be displayed when a file is shown,
     * it can mean last change or creation date... */
    fileDate?: Date;
    files: string[];
    directories: string[];
    directoriesBeingCreated: string[];
    directoriesBeingRenamed: string[];
    filesBeingCreated: string[];
    filesBeingRenamed: string[];
    showHidden: boolean;
    onNavigate(params: { kind: "file" | "directory"; relativePath: string }): void;
    onEditBasename(params: {
        kind: "file" | "directory";
        basename: string;
        editedBasename: string;
    }): void;
    onDeleteItem(params: { kind: "file" | "directory"; basename: string }): void;
    onCreateItem(params: { kind: "file" | "directory"; basename: string }): void;
    onCopyPath(params: { path: string }): void;
    scrollableDivRef: RefObject<any>;
};

const useStyles = makeStyles<{ cmdTranslationTop: number }>()(
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
        },
        "breadcrump": {
            "marginTop": theme.spacing(3),
            "marginBottom": theme.spacing(4),
        },
    }),
);

export const Explorer = memo((props: ExplorerProps) => {
    const {
        className,
        useCase: wordForFile,
        getIsValidBasename,
        evtTranslation,
        browsablePath,
        currentPath,
        isNavigating,
        file,
        fileDate,
        showHidden,
        evtAction,
        onNavigate,
        onEditBasename,
        onCopyPath,
        onDeleteItem,
        onCreateItem,
        scrollableDivRef,
    } = props;

    useMemo(
        () => assert(!pathRelative(browsablePath, currentPath).startsWith("..")),
        [browsablePath, currentPath],
    );

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
                showHidden
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
            showHidden,
        ],
    );

    const Items = useWithProps(PolymorphExplorerItems, {
        "visualRepresentationOfAFile": wordForFile,
        getIsValidBasename,
    });

    const Icon = useWithProps(FileOrDirectoryIcon, {
        "visualRepresentationOfAFile": wordForFile,
    });

    const ButtonBar = useWithProps(PolymorphExplorerButtonBar, { wordForFile });

    const { t } = useTranslation("Explorer");

    const [selectedItemKind, setSelectedItemKind] = useState<
        "file" | "directory" | "none"
    >("none");

    const onSelectedItemKindValueChange = useConstCallback(
        ({
            selectedItemKind,
        }: Parameters<ItemsProps["onSelectedItemKindValueChange"]>[0]) =>
            setSelectedItemKind(selectedItemKind),
    );

    const [isSelectedItemInEditingState, setIsSelectedItemInEditingState] =
        useState(false);

    const onIsSelectedItemInEditingStateValueChange = useConstCallback(
        ({
            isSelectedItemInEditingState,
        }: Parameters<ItemsProps["onIsSelectedItemInEditingStateValueChange"]>[0]) =>
            setIsSelectedItemInEditingState(isSelectedItemInEditingState),
    );

    const onBreadcrumpNavigate = useConstCallback(
        ({ upCount }: Parameters<BreadcrumpProps["onNavigate"]>[0]) => {
            onNavigate({
                "kind": "directory",
                "relativePath": pathJoin(...new Array(upCount).fill("..")),
            });
        },
    );

    const itemsOnNavigate = useConstCallback(
        ({ kind, basename }: Parameters<ItemsProps["onNavigate"]>[0]) =>
            onNavigate({
                kind,
                "relativePath": basename,
            }),
    );

    const [evtBreadcrumpAction] = useState(() =>
        Evt.create<UnpackEvt<BreadcrumpProps["evtAction"]>>(),
    );

    const itemsOnCopyPath = useConstCallback(
        ({ basename }: Parameters<ItemsProps["onCopyPath"]>[0]) => {
            evtBreadcrumpAction.post({
                "action": "DISPLAY COPY FEEDBACK",
                "basename": basename === "." ? undefined : basename,
            });

            onCopyPath({ "path": pathJoin(currentPath, basename) });
        },
    );

    const onGoBack = useConstCallback(() =>
        onNavigate({
            "kind": "directory",
            "relativePath": "..",
        }),
    );

    const [{ evtItemsAction }] = useState(() => ({
        "evtItemsAction": Evt.create<UnpackEvt<ItemsProps["evtAction"]>>(),
    }));

    const buttonBarCallback = useConstCallback<ButtonBarProps["callback"]>(buttonId => {
        switch (buttonId) {
            case "refresh":
                onNavigate({
                    "kind": !file ? "directory" : "file",
                    "relativePath": ".",
                });
                break;
            case "rename":
                evtItemsAction.post("START EDITING SELECTED ITEM BASENAME");
                break;
            case "delete":
                evtItemsAction.post("DELETE SELECTED ITEM");
                break;
            case "copy path":
                if (!!file) {
                    itemsOnCopyPath({ "basename": "." });
                    break;
                }

                evtItemsAction.post("COPY SELECTED ITEM PATH");
                break;
            case "create directory":
                onCreateItem({
                    "kind": "directory" as const,
                    "basename": generateUniqDefaultName({
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
            case "create file":
                onCreateItem({
                    "kind": "file" as const,
                    "basename": generateUniqDefaultName({
                        "names": files,
                        "buildName": buildNameFactory({
                            "defaultName": t("untitled what", {
                                "what": t(wordForFile),
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
        useCmdTranslationPositioning();

    const isCurrentPathBrowsablePathRoot = useMemo(
        () => pathRelative(browsablePath, currentPath) === "",
        [browsablePath, currentPath],
    );

    const { classes, cx, css, theme } = useStyles({
        ...props,
        cmdTranslationTop,
    });

    const { formattedDate } = (function useClosure() {
        let formattedDate: string | undefined = useFormattedDate({
            "date": fileDate ?? new Date(0),
        });

        if (fileDate === undefined) {
            formattedDate = undefined;
        }

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
                    <ButtonBar
                        selectedItemKind={selectedItemKind}
                        isSelectedItemInEditingState={isSelectedItemInEditingState}
                        isViewingFile={!!file}
                        callback={buttonBarCallback}
                    />
                </div>
                <CmdTranslation
                    className={classes.cmdTranslation}
                    evtTranslation={evtTranslation}
                    maxHeight={cmdTranslationMaxHeight}
                />
                {isCurrentPathBrowsablePathRoot ? null : (
                    <DirectoryHeader
                        title={pathBasename(currentPath)}
                        onGoBack={onGoBack}
                        subtitle={formattedDate}
                        image={
                            <Icon
                                kind={file ? "file" : "directory"}
                                standardizedWidth="big"
                            />
                        }
                    />
                )}
                <Breadcrump
                    className={classes.breadcrump}
                    minDepth={getPathDepth(browsablePath)}
                    path={currentPath.split("/")}
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
                    {file ? (
                        <Card>{file}</Card>
                    ) : (
                        <Items
                            //className={css({ "height": "100%" })}
                            className={undefined}
                            files={files}
                            isNavigating={isNavigating}
                            directories={directories}
                            directoriesBeingCreated={directoriesBeingCreated}
                            directoriesBeingRenamed={directoriesBeingRenamed}
                            filesBeingCreated={filesBeingCreated}
                            filesBeingRenamed={filesBeingRenamed}
                            onNavigate={itemsOnNavigate}
                            onEditBasename={onEditBasename}
                            evtAction={evtItemsAction}
                            onSelectedItemKindValueChange={onSelectedItemKindValueChange}
                            onIsSelectedItemInEditingStateValueChange={
                                onIsSelectedItemInEditingStateValueChange
                            }
                            onCopyPath={itemsOnCopyPath}
                            onDeleteItem={itemsOnDeleteItem}
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
                                              return wordForFile;
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

function useCmdTranslationPositioning() {
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
