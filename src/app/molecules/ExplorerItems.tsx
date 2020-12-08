
import React, { useMemo, useState, useEffect } from "react";
import Grid from '@material-ui/core/Grid';
import type { Props as ExplorerItemProps } from "../atoms/ExplorerItem";
import { explorerItemFactory } from "../atoms/explorerItemFactory";
import { assert } from "evt/tools/typeSafety/assert";
import { allUniq } from "evt/tools/reducers/allUniq";
import memoize from "memoizee";
import { useTheme } from "@material-ui/core/styles";
import { useWindowInnerWidth } from "app/utils/hooks/useWindowInnerWidth";

export type Props = {
    /** [HIGHER ORDER] */
    visualRepresentationOfAFile: ExplorerItemProps["visualRepresentationOfAFile"];
    /** [HIGHER ORDER] */
    getIsValidBasename(params: { basename: string; }): boolean;

    /** Assert all uniq */
    files: string[];
    /** Assert all uniq */
    directories: string[];
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

    const { ExplorerItem } = useMemo(
        () => explorerItemFactory({ visualRepresentationOfAFile }),
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

    const onMouseEventFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string, i: number) =>
                ({ type, target }: Parameters<ExplorerItemProps["onMouseEvent"]>[0]) => {

                    switch (type) {
                        case "down":

                            const key = getKey({ kind, i });

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
        [onOpen, selectedItemKey]
    );

    const onEditedBasenameFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ editedBasename }: Parameters<ExplorerItemProps["onEditedBasename"]>[0]) => 
                    onEditedBasename({ kind, basename, editedBasename }),
        ),
        [onEditedBasename]
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
                })()).map(
                    (basename, i) => {

                        const key = getKey({ kind, i });
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
                                    onMouseEvent={onMouseEventFactory(kind, basename, i)}
                                    onEditedBasename={onEditedBasenameFactory(kind, basename)}
                                    getIsValidBasename={getIsValidBasenameFactory(kind, basename)}
                                />
                            </Grid>
                        );

                    }
                ))}

        </Grid>
    );

}

function getKey(params: {
    kind: "file" | "directory",
    i: number
}): string {
    const { kind, i } = params;
    return `${kind}${i}`;
}
