
import React, { useMemo, useState, useEffect } from "react";
import Grid from '@material-ui/core/Grid';
import type { Props as ExplorerItemProps } from "./ExplorerItem";
import { ExplorerItem as SecretOrFileExplorerItem } from "./ExplorerItem";
import { assert } from "evt/tools/typeSafety/assert";
import { allUniq } from "evt/tools/reducers/allUniq";
import memoize from "memoizee";
import { useTheme } from "@material-ui/core/styles";
import { useWindowInnerWidth } from "app/utils/hooks/useWindowInnerWidth";
import { withProps } from "app/utils/withProps";
import { getKeyPropFactory } from "app/utils/getKeyProp";

export type Props = {
    /** [HIGHER ORDER] */
    visualRepresentationOfAFile: ExplorerItemProps["visualRepresentationOfAFile"];
    /** [HIGHER ORDER] */
    getIsValidBasename(params: { basename: string; }): boolean;

    /** Assert all uniq */
    files: string[];
    /** Assert all uniq */
    directories: string[];

    /** Refers to the new basename */
    renameRequestBeingProcessed: { kind: "file" | "directory", basename: string } | undefined;
    onOpen(params: { kind: "file" | "directory"; basename: string; }): void;
    onEditedBasename(params: { kind: "file" | "directory"; basename: string; editedBasename: string; }): void;
};


export function ExplorerItems(props: Props) {

    const {
        visualRepresentationOfAFile,
        getIsValidBasename,
        files,
        directories,
        onOpen,
        onEditedBasename,
        renameRequestBeingProcessed
    } = props;

    const ExplorerItem = useMemo(
        () => withProps(SecretOrFileExplorerItem, { visualRepresentationOfAFile }),
        [visualRepresentationOfAFile]
    );

    const theme = useTheme();

    const { windowInnerWidth } = useWindowInnerWidth();

    useMemo(
        () => assert(
            (
                files.reduce(...allUniq()) &&
                directories.reduce(...allUniq()) &&
                [...files, ...directories].every(basename => getIsValidBasename({ basename }))
            ),
            "Can't have two file or directory with the same name and all basename must be valid"
        ),
        [files, directories, getIsValidBasename]
    );

    const [selectedItemKey, setSelectedItemKey] = useState<string | undefined>(undefined);
    const [isSelectedItemBeingEdited, setIsSelectedItemBeingEdited] = useState(false);


    const standardizedWidth = useMemo(
        (): ExplorerItemProps["standardizedWidth"] => {

            if (windowInnerWidth > theme.breakpoints.width("md")) {

                return "big";

            }

            return "normal";

        },
        [windowInnerWidth, theme]
    );

    const [{ getKeyProp, transfersKeyProp }] = useState(
        () => getKeyPropFactory<{
            kind: "directory" | "file";
            basename: string;
        }>()
    );

    const onMouseEventFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ type, target }: Parameters<ExplorerItemProps["onMouseEvent"]>[0]) => {

                    switch (type) {
                        case "down":

                            const key = getKeyProp({ kind, basename });

                            if (target === "text" && selectedItemKey === key) {

                                setIsSelectedItemBeingEdited(true);

                                break;

                            } else {

                                setIsSelectedItemBeingEdited(false);

                            }

                            setSelectedItemKey(key);

                            break;

                        case "double":
                            setIsSelectedItemBeingEdited(false);
                            onOpen({ kind, basename });
                            break;
                    }
                }
        ),
        [onOpen, selectedItemKey, getKeyProp]
    );


    const onEditedBasenameFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ editedBasename }: Parameters<ExplorerItemProps["onEditedBasename"]>[0]) => {

                    transfersKeyProp({
                        "toValues": { kind, "basename": editedBasename },
                        "fromValues": { kind, basename }
                    });

                    onEditedBasename({ kind, basename, editedBasename });

                }
        ),
        [onEditedBasename, transfersKeyProp]
    );

    useEffect(
        () => {

            if (renameRequestBeingProcessed === undefined) {
                setIsSelectedItemBeingEdited(false);
            }

        },
        [renameRequestBeingProcessed]
    );



    const getIsValidBasenameFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ basename: candidateBasename }: Parameters<ExplorerItemProps["getIsValidBasename"]>[0]) => {

                    if (basename === candidateBasename) {
                        return true;
                    }

                    if (
                        (() => {
                            switch (kind) {
                                case "directory": return directories;
                                case "file": return files;
                            }
                        })().indexOf(candidateBasename) >= 0
                    ) {
                        return false;
                    }

                    return getIsValidBasename({ "basename": candidateBasename });

                }
        ),
        [getIsValidBasename, directories, files]
    );


    return (
        <Grid container wrap="wrap" justify="flex-start" spacing={1}>
            {(["directory", "file"] as const).map(
                kind => ((() => {
                    switch (kind) {
                        case "directory": return directories;
                        case "file": return files;
                    }
                })()).map(basename => {

                    const key = getKeyProp({ kind, basename });
                    const isSelected = selectedItemKey === key;

                    return (
                        <Grid item key={key}>
                            <ExplorerItem
                                kind={kind}
                                basename={basename}
                                isSelected={isSelected}
                                isBeingEdited={isSelected && isSelectedItemBeingEdited}
                                isRenameRequestBeingProcessed={
                                    renameRequestBeingProcessed !== undefined &&
                                    renameRequestBeingProcessed.kind === kind &&
                                    renameRequestBeingProcessed.basename === basename
                                }
                                standardizedWidth={standardizedWidth}
                                onMouseEvent={onMouseEventFactory(kind, basename)}
                                onEditedBasename={onEditedBasenameFactory(kind, basename)}
                                getIsValidBasename={getIsValidBasenameFactory(kind, basename)}
                            />
                        </Grid>
                    );

                }))}

        </Grid>
    );

}
