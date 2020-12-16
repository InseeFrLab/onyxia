
import React, { useMemo } from "react";
import { withProps } from "app/utils/withProps";
import { ExplorerItems as SecretOrFileExplorerItems } from "app/components/Explorer/ExplorerItems";
import { ExplorerItemCreationDialog as SecretOrFileItemCreationDialog } from "app/components/Explorer/ExplorerItemCreationDialog";
import { PathNavigator } from "./PathNavigator";
import { ExplorerButtonBar as SecretOrFileExplorerButtonBar } from "./ExplorerButtonBar";

export type Props = {
    /** [HIGHER ORDER] */
    type: "secret" | "file";
    /** [HIGHER ORDER] */
    getIsValidBasename(params: { basename: string; }): boolean;

    currentPath: string;

    file: React.ReactNode;
    files: string[];
    directories: string[];

    onOpen(params: { kind: "file" | "directory"; basename: string; }): void;
    onEditedBasename(params: { kind: "file" | "directory"; basename: string; editedBasename: string; }): void;
};

export function Explorer(props: Props) {

    const { type, getIsValidBasename } = props;

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





}
