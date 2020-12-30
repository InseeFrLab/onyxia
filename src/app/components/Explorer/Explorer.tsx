
import React, { useMemo, useState, useCallback } from "react";
import { withProps } from "app/utils/withProps";
import { ExplorerItems as SecretOrFileExplorerItems } from "./ExplorerItems";
import type { Props as ItemsProps } from "./ExplorerItems";
import { PathNavigator } from "./PathNavigator";
import type { Props as PathNavigatorProps } from "./PathNavigator";
import { ExplorerButtonBar as SecretOrFileExplorerButtonBar } from "./ExplorerButtonBar";
import { Props as ButtonBarProps } from "./ExplorerButtonBar";
import { Evt } from "evt";
import { join as pathJoin } from "path";
import type { UnpackEvt } from "evt";
import { Typography } from "app/components/designSystem/Typography";
import { useTranslation } from "app/i18n/useTranslations";
import type { Props as CmdTranslationProps } from "./CmdTranslation";
import { CmdTranslation } from "./CmdTranslation";

export type Props = {
    /** [HIGHER ORDER] */
    type: "secret" | "file";
    /** [HIGHER ORDER] */
    getIsValidBasename(params: { basename: string; }): boolean;

    evtTranslation: CmdTranslationProps["evtTranslation"];

    currentPath: string;
    isNavigating: boolean;
    file: React.ReactNode;
    files: string[];
    directories: string[];
    directoriesBeingCreatedOrRenamed: string[];
    filesBeingCreatedOrRenamed: string[];
    onNavigate(params: { kind: "file" | "directory"; relativePath: string; }): void;
    onEditBasename(params: { kind: "file" | "directory"; basename: string; editedBasename: string; }): void;
    onDeleteItem(params: { kind: "file" | "directory"; basename: string; }): void;
    onCreateItem(params: { kind: "file" | "directory"; basename: string; }): void;
    onCopyPath(params: { path: string; }): void;

};

export function Explorer(props: Props) {

    const {
        type: wordForFile,
        getIsValidBasename,
        evtTranslation,
        currentPath,
        isNavigating,
        file,
        files,
        directories,
        filesBeingCreatedOrRenamed,
        directoriesBeingCreatedOrRenamed,
        onNavigate,
        onEditBasename,
        onCopyPath,
        onDeleteItem,
        onCreateItem
    } = props;

    const Items = useMemo(
        () => withProps(
            SecretOrFileExplorerItems,
            {
                "visualRepresentationOfAFile": wordForFile,
                getIsValidBasename
            }
        ),
        [wordForFile, getIsValidBasename]
    );


    const ButtonBar = useMemo(
        () => withProps(
            SecretOrFileExplorerButtonBar,
            { wordForFile }
        ),
        [wordForFile]
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
                case "create file":

                    const { appendNumberIfNecessary } = appendNumberIfNecessaryFactory(
                        { files, directories }
                    );

                    onCreateItem(
                        (() => {
                            switch (action) {
                                case "create directory": {

                                    const kind = "directory" as const;

                                    return {
                                        kind,
                                        "basename": appendNumberIfNecessary({
                                            kind,
                                            "basename": t("untitled what", { "what": t("folder") })
                                        })
                                    };
                                }
                                case "create file": {

                                    const kind = "file" as const;

                                    return {
                                        kind,
                                        "basename": appendNumberIfNecessary({
                                            kind,
                                            "basename": t("untitled what", { "what": t(wordForFile) })
                                        })
                                    };

                                }
                            }
                        })()
                    );
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

    const pathNavigatorCallback = useCallback(
        ({ relativePath }: Parameters<PathNavigatorProps["callback"]>[0]) => {
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

    return (
        <>
            <ButtonBar
                isThereAnItemSelected={isThereAnItemSelected}
                isSelectedItemInEditingState={isSelectedItemInEditingState}
                callback={buttonBarCallback}
            />
            <PathNavigator
                minDepth={!isNavigating ? 0 : Infinity}
                path={currentPath}
                callback={pathNavigatorCallback}
            />
            {
                file ?
                    file
                    :
                    (
                        files.length === 0 && directories.length === 0 ?
                            <Typography>{t("empty directory")}</Typography> :
                            <Items
                                files={files}
                                isNavigating={isNavigating}
                                directories={directories}
                                filesBeingCreatedOrRenamed={filesBeingCreatedOrRenamed}
                                directoriesBeingCreatedOrRenamed={directoriesBeingCreatedOrRenamed}
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
            <CmdTranslation evtTranslation={evtTranslation} />
        </>
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

function appendNumberIfNecessaryFactory(
    params: {
        directories: string[];
        files: string[];
    }
) {

    const {
        directories,
        files
    } = params;

    function isBasenameAvailable(
        params: {
            kind: "file" | "directory";
            basename: string;
        }
    ): boolean {
        const { kind, basename } = params;
        return !(() => {
            switch (kind) {
                case "directory": return directories;
                case "file": return files;
            }
        })().includes(basename);
    }

    function appendNumberIfNecessaryRec(
        params: {
            kind: "file" | "directory";
            basename: string;
            n: number;
        }
    ): string {

        const { kind, basename, n } = params;

        const fixedBasename = `${basename}${n === 1 ? "" : ` ${n - 1}`}`;

        if (isBasenameAvailable({ kind, "basename": fixedBasename })) {
            return fixedBasename;
        }

        return appendNumberIfNecessaryRec({
            kind,
            basename,
            "n": n + 1
        });

    }

    function appendNumberIfNecessary(
        params: {
            kind: "file" | "directory";
            basename: string;
        }

    ) {

        return appendNumberIfNecessaryRec({
            ...params,
            "n": 1
        });

    }

    return { appendNumberIfNecessary };

}