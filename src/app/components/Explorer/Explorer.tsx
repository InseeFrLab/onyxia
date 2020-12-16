
import React, { useMemo, useState, useCallback } from "react";
import { withProps } from "app/utils/withProps";
import { ExplorerItems as SecretOrFileExplorerItems } from "./ExplorerItems";
import type { Props as ItemsProps } from "./ExplorerItems";
import { ExplorerItemCreationDialog as SecretOrFileItemCreationDialog } from "app/components/Explorer/ExplorerItemCreationDialog";
import type { Props as DialogProps } from "./ExplorerItemCreationDialog";
import { PathNavigator } from "./PathNavigator";
import type { Props as PathNavigatorProps } from "./PathNavigator";
import { ExplorerButtonBar as SecretOrFileExplorerButtonBar } from "./ExplorerButtonBar";
import { Props as ButtonBarProps } from "./ExplorerButtonBar";
import { Evt } from "evt";
import { assert } from "evt/tools/typeSafety/assert";
import { join as pathJoin } from "path";


export type Props = {
    /** [HIGHER ORDER] */
    type: "secret" | "file";
    /** [HIGHER ORDER] */
    getIsValidBasename(params: { basename: string; }): boolean;

    currentPath: string;
    isNavigating: boolean;
    file: React.ReactNode;
    files: string[];
    directories: string[];
    directoriesBeingCreatedOrRenamed: string[];
    filesBeingCreatedOrRenamed: string[];
    onNavigate(params: { kind: "file" | "directory"; relativePath: string; }): void;
    onEditedBasename(params: { kind: "file" | "directory"; basename: string; editedBasename: string; }): void;
    onDelete(params: { kind: "file" | "directory"; basename: string; }): void;
    onCreate(params: { kind: "file" | "directory"; basename: string; }): void;
    onCopyPath(params: { path: string; }): void;

};

export function Explorer(props: Props) {

    const {
        type,
        getIsValidBasename,
        currentPath,
        files,
        directories,
        filesBeingCreatedOrRenamed,
        directoriesBeingCreatedOrRenamed,
        onNavigate,
        onEditedBasename,
        onDelete,
        onCopyPath,
        onCreate
    } = props;

    const Items = useMemo(
        () => withProps(
            SecretOrFileExplorerItems,
            {
                "visualRepresentationOfAFile": type,
                getIsValidBasename
            }
        ),
        [type, getIsValidBasename]
    );

    const ItemCreationDialog = useMemo(
        () => withProps(
            SecretOrFileItemCreationDialog,
            { "wordForFile": type }
        ),
        [type]
    );

    const ButtonBar = useMemo(
        () => withProps(
            SecretOrFileExplorerButtonBar,
            { "wordForFile": type }
        ),
        [type]
    );


    const [dialogIsOpen, setDialogIsOpen] = useState(false);

    const [dialogCreateWhat, setDialogCreateWhat] = useState<"directory" | "file">("file");

    const [evtStartEditing] = useState(() => Evt.create());

    const [
        selectedItem,
        setSelectedItem
    ] = useState<Parameters<ItemsProps["onItemSelected"]>[0]>(undefined);

    const buttonBarCallback = useCallback(
        ({ action }: Parameters<ButtonBarProps["callback"]>[0]) => {

            switch (action) {
                case "rename":
                    evtStartEditing.post();
                    break;
                case "delete": {

                    assert(selectedItem !== undefined);

                    const { kind, getBasename } = selectedItem;

                    onDelete({
                        kind,
                        "basename": getBasename()
                    });

                } break;
                case "copy path":

                    onCopyPath({
                        "path":
                            selectedItem === undefined ?
                                currentPath :
                                pathJoin(currentPath, selectedItem.getBasename())
                    });

                    break;
                case "create directory":
                case "create file":

                    setDialogCreateWhat((() => {
                        switch (action) {
                            case "create file": return "file";
                            case "create directory": return "directory"
                        }
                    })());
                    setDialogIsOpen(true);
                    break;

            }

        },
        [evtStartEditing, selectedItem]
    );



    const onItemSelected = useCallback(
        (params: Parameters<ItemsProps["onItemSelected"]>[0]) =>
            setSelectedItem(params),
        []
    );


    const dialogGetIsValidName = useCallback(
        (name: string) => (
            getIsValidBasename({ "basename": name }) &&
            !(() => {
                switch (dialogCreateWhat) {
                    case "directory": return directories;
                    case "file": return files;
                }
            })().includes(name)
        ),
        [dialogCreateWhat, directories, files, getIsValidBasename]
    );

    const dialogCallback = useCallback(
        (params: Parameters<DialogProps["callback"]>[0]) => {

            if (params.doCreate) {

                onCreate({
                    "kind": dialogCreateWhat,
                    "basename": params.name

                });

            }

            setDialogIsOpen(false);

        },
        []
    );


    const itemsOnNavigate = useCallback(
        ({ kind, basename }: Parameters<ItemsProps["onNavigate"]>[0]) =>
            onNavigate({
                kind,
                "relativePath": pathJoin(currentPath, basename)
            }),

        [onNavigate]
    );


    const pathNavigatorCallback = useCallback(
        ({ relativePath }: Parameters<PathNavigatorProps["callback"]>[0]) => {
            onNavigate({
                "kind": "directory",
                relativePath
            })
        },
        []
    );

    return (
        <>
            <ItemCreationDialog
                isOpen={dialogIsOpen}
                createWhat={dialogCreateWhat}
                getIsValidName={dialogGetIsValidName}
                callback={dialogCallback}
            />
            <ButtonBar
                isThereAnItemSelected={selectedItem !== undefined}
                callback={buttonBarCallback}
            />
            <PathNavigator
                minDepth={0}
                path={currentPath}
                callback={pathNavigatorCallback}
            />
            <Items
                files={files}
                directories={directories}
                filesBeingCreatedOrRenamed={filesBeingCreatedOrRenamed}
                directoriesBeingCreatedOrRenamed={directoriesBeingCreatedOrRenamed}
                onNavigate={itemsOnNavigate}
                onEditedBasename={onEditedBasename}
                evtStartEditing={evtStartEditing}
                onItemSelected={onItemSelected}
            />
        </>
    );

}
