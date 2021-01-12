
import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { withProps } from "app/utils/withProps";
import type { Props as ItemsProps } from "./ExplorerItems";
import { Breadcrump } from "./Breadcrump";
import type { Props as BreadcrumpProps } from "./Breadcrump";
import { Props as ButtonBarProps } from "./ExplorerButtonBar";
import { Evt } from "evt";
import { join as pathJoin, basename as pathBasename } from "path";
import type { UnpackEvt } from "evt";
import { Typography } from "app/components/designSystem/Typography";
import { useTranslation } from "app/i18n/useTranslations";
import type { Props as CmdTranslationProps } from "./CmdTranslation";
import { CmdTranslation } from "./CmdTranslation";
import { generateUniqDefaultName, buildNameFactory } from "app/utils/generateUniqDefaultName";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import { useSemanticGuaranteeMemo } from "evt/tools/hooks/useSemanticGuaranteeMemo";

import { ExplorerItems as PolymorphExplorerItems } from "./ExplorerItems";
import { ExplorerButtonBar as PolymorphExplorerButtonBar } from "./ExplorerButtonBar";
import { ExplorerFileHeader as PolymorphExplorerFileHeader } from "./ExplorerFileHeader";
import type { Id } from "evt/tools/typeSafety";
import { useDOMRect } from "app/utils/hooks/useDOMRect";
import clsx from "clsx";

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
    onNavigate(params: { kind: "file" | "directory"; relativePath: string; }): void;
    onEditBasename(params: { kind: "file" | "directory"; basename: string; editedBasename: string; }): void;
    onDeleteItem(params: { kind: "file" | "directory"; basename: string; }): void;
    onCreateItem(params: { kind: "file" | "directory"; basename: string; }): void;
    onCopyPath(params: { path: string; }): void;

    paddingLeftSpacing: number;

};

type CmdTranslationVerticalPositioning = Id<React.CSSProperties, {
    top: number;
    height: number;
}>;

const useStyles = makeStyles(
    theme => createStyles<
        "root" | "cmdTranslation" | "scrollable" | "buttonBarWrapper",
        Props & { cmdTranslationVerticalPositioning: CmdTranslationVerticalPositioning; }
    >({
        "root": ({ paddingLeftSpacing })=>({
            "display": "flex",
            "flexDirection": "column",
            "position": "relative",
            "& > *:not(:first-child)": {
                "marginLeft": theme.spacing(paddingLeftSpacing)
            }
        }),
        "buttonBarWrapper": {
            "zIndex": 0,
        },
        "scrollable": {
            "overflow": "auto",
            "flex": 1
        },
        "cmdTranslation": ({ cmdTranslationVerticalPositioning }) => ({
            "zIndex": 1,
            "position": "absolute",
            "right": 0,
            "width": "40%",
            ...cmdTranslationVerticalPositioning
        })
    })
);


export function Explorer(props: Props) {

    const {
        className,
        type: wordForFile,
        getIsValidBasename,
        evtTranslation,
        currentPath,
        isNavigating,
        file,
        fileDate,
        files,
        directories,
        directoriesBeingCreated,
        directoriesBeingRenamed,
        filesBeingCreated,
        filesBeingRenamed,
        onNavigate,
        onEditBasename,
        onCopyPath,
        onDeleteItem,
        onCreateItem,
        paddingLeftSpacing
    } = props;


    const { Items, ButtonBar, FileHeader } = useSemanticGuaranteeMemo(
        () => {

            const visualRepresentationOfAFile = wordForFile;

            return {
                "Items":
                    withProps(
                        PolymorphExplorerItems,
                        {
                            visualRepresentationOfAFile,
                            getIsValidBasename
                        }
                    ),
                "ButtonBar": withProps(
                    PolymorphExplorerButtonBar,
                    {
                        wordForFile
                    }
                ),
                "FileHeader": withProps(
                    PolymorphExplorerFileHeader,
                    {
                        visualRepresentationOfAFile
                    }
                )
            };

        },
        [wordForFile, getIsValidBasename]
    );


    const { t } = useTranslation("Explorer");

    const [{ evtItemsAction }] = useState(() => ({
        "evtItemsAction": Evt.create<UnpackEvt<ItemsProps["evtAction"]>>(),
    }));

    const buttonBarCallback = useCallback(
        ({ action }: Parameters<ButtonBarProps["callback"]>[0]) => {

            switch (action) {
                case "rename":
                    evtItemsAction.post("START EDITING SELECTED ITEM BASENAME");
                    break;
                case "delete":
                    evtItemsAction.post("DELETE SELECTED ITEM");
                    break;
                case "copy path":
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
        [evtItemsAction, onCreateItem, t, wordForFile, files, directories]
    );



    const [isThereAnItemSelected, setIsThereAnItemSelected] = useState(false);

    const onIsThereAnItemSelectedValueChange = useCallback(
        ({ isThereAnItemSelected }: Parameters<ItemsProps["onIsThereAnItemSelectedValueChange"]>[0]) =>
            setIsThereAnItemSelected(isThereAnItemSelected),
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

    const itemsOnCopyPath = useCallback(
        ({ basename }: Parameters<ItemsProps["onCopyPath"]>[0]) =>
            onCopyPath({
                "path": pathJoin(currentPath, basename)
            }),

        [onCopyPath, currentPath]

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


    const {
        domRect: { bottom: rootBottom },
        ref: rootRef
    } = useDOMRect();

    // NOTE: To avoid https://reactjs.org/docs/hooks-reference.html#useimperativehandle
    const {
        domRect: { height: buttonBarHeight, bottom: buttonBarBottom },
        ref: buttonBarRef
    } = useDOMRect();

    const [
        cmdTranslationVerticalPositioning,
        setCmdTranslationBox
    ] = useState<CmdTranslationVerticalPositioning>(() => ({
        "top": 0,
        "height": 0
    }));

    const classes = useStyles({ ...props, cmdTranslationVerticalPositioning });

    useEffect(
        () => {

            setCmdTranslationBox({
                "top": buttonBarHeight,
                "height": rootBottom - buttonBarBottom - 200
            });

        },
        [
            buttonBarHeight,
            buttonBarBottom,
            rootBottom
        ]
    );

    return (
        <div ref={rootRef} className={clsx(className, classes.root)}>
            <div
                ref={buttonBarRef}
                className={classes.buttonBarWrapper}
            >
                <ButtonBar
                    paddingLeftSpacing={paddingLeftSpacing}
                    isThereAnItemSelected={isThereAnItemSelected}
                    isSelectedItemInEditingState={isSelectedItemInEditingState}
                    callback={buttonBarCallback}
                />
            </div>
            <CmdTranslation
                className={classes.cmdTranslation}
                evtTranslation={evtTranslation}
            />
            {
                file &&
                <FileHeader
                    fileBasename={pathBasename(currentPath)}
                    date={fileDate}
                    onBack={onBack}
                />
            }
            <Breadcrump
                minDepth={!isNavigating ? 0 : Infinity}
                path={currentPath}
                callback={breadcrumbCallback}
            />
            <Box className={classes.scrollable}>
                {
                    file ?
                        /* TODO: This is a temporary hack!! */
                        <div style={{ "paddingLeft": 8, "paddingRight": 20 }}>
                            {file}
                        </div>
                        :
                        (
                            files.length === 0 && directories.length === 0 ?
                                <Typography>{t("empty directory")}</Typography> :
                                <Items
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
                                    onIsThereAnItemSelectedValueChange={onIsThereAnItemSelectedValueChange}
                                    onIsSelectedItemInEditingStateValueChange={onIsSelectedItemInEditingStateValueChange}
                                    onCopyPath={itemsOnCopyPath}
                                    onDeleteItem={itemsOnDeleteItem}
                                />
                        )
                }
            </Box>
        </div>
    );

}
export declare namespace Explorer {
    export type I18nScheme = {
        'empty directory': undefined;
        'untitled what': { what: string; };
        folder: undefined;
        file: undefined;
        secret: undefined;
    };
}
