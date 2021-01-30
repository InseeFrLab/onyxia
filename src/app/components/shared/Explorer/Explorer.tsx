
import { createUseClassNames, cx, css, useTheme } from "app/theme/useClassNames";
import { useState, useEffect, useMemo } from "react";
import { useCallback } from "app/tools/hooks/useCallbackFactory";
import type { Props as ItemsProps } from "./ExplorerItems";
import { Breadcrump } from "./Breadcrump";
import type { Props as BreadcrumpProps } from "./Breadcrump";
import { Props as ButtonBarProps } from "./ExplorerButtonBar";
import { Evt } from "evt";
import { join as pathJoin, basename as pathBasename, relative as pathRelative } from "path";
import type { UnpackEvt } from "evt";
import { useTranslation } from "app/i18n/useTranslations";
import type { Props as CmdTranslationProps } from "./CmdTranslation";
import { CmdTranslation } from "./CmdTranslation";
import { generateUniqDefaultName, buildNameFactory } from "app/tools/generateUniqDefaultName";
import { assert } from "evt/tools/typeSafety/assert";
import { id } from "evt/tools/typeSafety/id";
import { Paper } from "app/components/designSystem/Paper";

import { ExplorerItems as PolymorphExplorerItems } from "./ExplorerItems";
import { ExplorerButtonBar as PolymorphExplorerButtonBar } from "./ExplorerButtonBar";
import { ExplorerFileOrDirectoryHeader as PolymorphExplorerFileOrDirectoryHeader } from "./ExplorerFileOrDirectoryHeader";
import { useDOMRect } from "app/tools/hooks/useDOMRect";
import { getPathDepth } from "app/tools/getPathDepth";
import { useWithProps } from "app/tools/hooks/useWithProps";

export type Props = {
    /** [HIGHER ORDER] */
    type: "secret" | "file";
    /** [HIGHER ORDER] */
    getIsValidBasename(params: { basename: string; }): boolean;

    /** 
     * For this component to work it must have a fixed width 
     * For being able to scroll without moving the button bar it must have a fixed height.
     * */
    className: string;

    evtTranslation: CmdTranslationProps["evtTranslation"];

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
    onNavigate(params: { kind: "file" | "directory"; relativePath: string; }): void;
    onEditBasename(params: { kind: "file" | "directory"; basename: string; editedBasename: string; }): void;
    onDeleteItem(params: { kind: "file" | "directory"; basename: string; }): void;
    onCreateItem(params: { kind: "file" | "directory"; basename: string; }): void;
    onCopyPath(params: { path: string; }): void;

    paddingLeftSpacing: number;

};

const { useClassNames } = createUseClassNames<Props & { cmdTranslationTop: number; }>()(
    ({ theme }, { cmdTranslationTop }) => ({
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
            "zIndex": 1
        },
        "breadcrump": {
            "marginTop": theme.spacing(2),
            "marginBottom": theme.spacing(3),
        }
    })
);

export function Explorer(props: Props) {

    const {
        className,
        type: wordForFile,
        getIsValidBasename,
        evtTranslation,
        browsablePath,
        currentPath,
        isNavigating,
        file,
        fileDate,
        showHidden,
        onNavigate,
        onEditBasename,
        onCopyPath,
        onDeleteItem,
        onCreateItem,
        paddingLeftSpacing
    } = props;

    useMemo(
        () => assert(!pathRelative(browsablePath, currentPath).startsWith("..")),
        [browsablePath, currentPath]
    );

    const [
        files,
        directories,
        directoriesBeingCreated,
        directoriesBeingRenamed,
        filesBeingCreated,
        filesBeingRenamed,
    ] = useMemo(
        () => ([
            props.files,
            props.directories,
            props.directoriesBeingCreated,
            props.directoriesBeingRenamed,
            props.filesBeingCreated,
            props.filesBeingRenamed,
        ] as const).map(
            showHidden ? id :
                arr => arr.filter(basename => !basename.startsWith(".")
                )),
        [
            props.files,
            props.directories,
            props.directoriesBeingCreated,
            props.directoriesBeingRenamed,
            props.filesBeingCreated,
            props.filesBeingRenamed,
            showHidden
        ]
    );

    const Items = useWithProps(
        PolymorphExplorerItems,
        {
            "visualRepresentationOfAFile": wordForFile,
            getIsValidBasename
        }
    );

    const ButtonBar = useWithProps(
        PolymorphExplorerButtonBar,
        { wordForFile }
    );

    const FileOrDirectoryHeader = useWithProps(
        PolymorphExplorerFileOrDirectoryHeader,
        { "visualRepresentationOfAFile": wordForFile }
    );



    const { t } = useTranslation("Explorer");

    const [selectedItemKind, setSelectedItemKind] = useState<"file" | "directory" | "none">("none");

    const onSelectedItemKindValueChange = useCallback(
        ({ selectedItemKind }: Parameters<ItemsProps["onSelectedItemKindValueChange"]>[0]) =>
            setSelectedItemKind(selectedItemKind),
        []
    );

    const [isSelectedItemInEditingState, setIsSelectedItemInEditingState] = useState(false);

    const onIsSelectedItemInEditingStateValueChange = useCallback(
        ({ isSelectedItemInEditingState }: Parameters<ItemsProps["onIsSelectedItemInEditingStateValueChange"]>[0]) =>
            setIsSelectedItemInEditingState(isSelectedItemInEditingState),
        []
    );

    const breadcrumbCallback = useCallback(
        ({ relativePath }: Parameters<BreadcrumpProps["callback"]>[0]) => {
            onNavigate({
                "kind": "directory",
                relativePath
            })
        },
        [onNavigate]
    );


    const itemsOnNavigate = useCallback(
        ({ kind, basename }: Parameters<ItemsProps["onNavigate"]>[0]) =>
            onNavigate({
                kind,
                "relativePath": basename
            }),
        [onNavigate]
    );

    const [evtBreadcrumpAction] = useState(() => Evt.create<UnpackEvt<BreadcrumpProps["evtAction"]>>());

    const itemsOnCopyPath = useCallback(
        ({ basename }: Parameters<ItemsProps["onCopyPath"]>[0]) => {

            evtBreadcrumpAction.post({
                "action": "DISPLAY COPY FEEDBACK",
                basename
            });

            onCopyPath({ "path": pathJoin(currentPath, basename) });

        },
        [onCopyPath, currentPath, evtBreadcrumpAction]
    );

    const itemsOnDeleteItem = useCallback(
        ({ kind, basename }: Parameters<ItemsProps["onDeleteItem"]>[0]) =>
            onDeleteItem({ kind, basename }),
        [onDeleteItem]
    );

    const onBack = useCallback(
        () => onNavigate({
            "kind": "directory",
            "relativePath": ".."
        }),
        [onNavigate]
    );

    const [{ evtItemsAction }] = useState(() => ({
        "evtItemsAction": Evt.create<UnpackEvt<ItemsProps["evtAction"]>>(),
    }));

    const buttonBarCallback = useCallback(
        ({ action }: Parameters<ButtonBarProps["callback"]>[0]) => {

            switch (action) {
                case "refresh":
                    onNavigate({
                        "kind": !file ? "directory" : "file",
                        "relativePath": "."
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
                        itemsOnCopyPath({ "basename": "." })
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
                                "defaultName": t(
                                    "untitled what",
                                    { "what": t("folder") }
                                ),
                                "separator": "_"
                            })
                        })

                    });
                    break;
                case "create file":
                    onCreateItem({
                        "kind": "file" as const,
                        "basename": generateUniqDefaultName({
                            "names": files,
                            "buildName": buildNameFactory({
                                "defaultName": t(
                                    "untitled what",
                                    { "what": t(wordForFile) }
                                ),
                                "separator": "_"
                            })
                        })
                    });
                    break;
            }

        },
        [
            evtItemsAction, onCreateItem, t, wordForFile,
            files, directories, file, itemsOnCopyPath,
            onNavigate
        ]
    );

    const {
        rootRef,
        buttonBarRef,
        cmdTranslationTop,
        cmdTranslationMaxHeight
    } = useCmdTranslationPositioning();

    const isCurrentPathBrowsablePathRoot = useMemo(
        () => pathRelative(browsablePath, currentPath) === "",
        [browsablePath, currentPath]
    );

    const { classNames } = useClassNames({ ...props, cmdTranslationTop });

    const theme = useTheme();

    return (
        <div
            ref={rootRef}
            className={cx(classNames.root, className)}
        >
            <div ref={buttonBarRef} >
                <ButtonBar
                    paddingLeftSpacing={paddingLeftSpacing}
                    selectedItemKind={selectedItemKind}
                    isSelectedItemInEditingState={isSelectedItemInEditingState}
                    isViewingFile={!!file}
                    callback={buttonBarCallback}
                />
            </div>
            <CmdTranslation
                className={classNames.cmdTranslation}
                evtTranslation={evtTranslation}
                maxHeight={cmdTranslationMaxHeight}
            />
            <div className={css({
                "flex": 1,
                "overflow": "hidden",
                "display": "flex",
                "flexDirection": "column",
                "& > *:not(:last-child)": {
                    "paddingLeft": theme.spacing(paddingLeftSpacing)
                }
            })}>
                {
                    isCurrentPathBrowsablePathRoot ?
                        null
                        :
                        <FileOrDirectoryHeader
                            kind={file ? "file" : "directory"}
                            fileBasename={pathBasename(currentPath)}
                            date={fileDate}
                            onBack={onBack}
                        />
                }
                <Breadcrump
                    className={classNames.breadcrump}
                    minDepth={getPathDepth(browsablePath)}
                    path={currentPath}
                    isNavigationDisabled={isNavigating}
                    callback={breadcrumbCallback}
                    evtAction={evtBreadcrumpAction}
                />
                <div className={cx(css({
                    "flex": 1,
                    "paddingLeft": theme.spacing(paddingLeftSpacing),
                    "paddingRight": theme.spacing(1),
                    "overflow": "auto"
                }))}>
                    {
                        file ?
                            <Paper elevation={2}>
                                {file}
                            </Paper>
                            :
                            <Items
                                className={css({ "height": "100%" })}
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
                                onIsSelectedItemInEditingStateValueChange={onIsSelectedItemInEditingStateValueChange}
                                onCopyPath={itemsOnCopyPath}
                                onDeleteItem={itemsOnDeleteItem}
                            />
                    }
                </div>


            </div>
        </div>
    );

}
export declare namespace Explorer {
    export type I18nScheme = {
        'untitled what': { what: string; };
        folder: undefined;
        file: undefined;
        secret: undefined;
    };
}


function useCmdTranslationPositioning() {

    const {
        domRect: { bottom: rootBottom },
        ref: rootRef
    } = useDOMRect();

    // NOTE: To avoid https://reactjs.org/docs/hooks-reference.html#useimperativehandle
    const {
        domRect: {
            height: buttonBarHeight,
            bottom: buttonBarBottom
        },
        ref: buttonBarRef
    } = useDOMRect();

    const [cmdTranslationTop, setCmdTranslationTop] =
        useState<number>(0);

    const [cmdTranslationMaxHeight, setCmdTranslationMaxHeight] =
        useState<number>(0);


    useEffect(
        () => {

            setCmdTranslationTop(buttonBarHeight);

            setCmdTranslationMaxHeight(rootBottom - buttonBarBottom - 30);

        },
        [
            buttonBarHeight,
            buttonBarBottom,
            rootBottom
        ]
    );

    return {
        rootRef, buttonBarRef,
        cmdTranslationTop, cmdTranslationMaxHeight
    };

}
