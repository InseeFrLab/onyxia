
import React, { useMemo } from "react";
import { withProps } from "app/utils/withProps";
import { ExplorerItems as SecretOrFileExplorerItems } from "app/components/Explorer/ExplorerItems";
import { ItemCreationDialog as SecretOrFileItemCreationDialog } from "app/components/Explorer/ItemCreationDialog";
import { PathNavigator } from "./PathNavigator";

export type Props = {
    /** [HIGHER ORDER] */
    type: "secret" | "file";
    /** [HIGHER ORDER] */
    getIsValidBasename(params: { basename: string; }): boolean;

    currentPath: string;

    file: React.ReactNode;
    files: string[];
    directories: string[];

    /** basename refers to the new base name that should have already be updated */
    renameRequestBeingProcessed: { kind: "file" | "directory", basename: string } | undefined;
    onOpen(params: { kind: "file" | "directory"; basename: string; }): void;
    onEditedBasename(params: { kind: "file" | "directory"; basename: string; editedBasename: string; }): void;
};

export function Explorer(props: Props) {

    const { type, getIsValidBasename } = props;

    const ExplorerItems = useMemo(
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



}
