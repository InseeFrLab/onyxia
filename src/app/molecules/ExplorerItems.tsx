
import React, { useMemo, useState } from "react";
import Grid from '@material-ui/core/Grid';
import type { Props as ExplorerItemProps } from "../atoms/ExplorerItem";
import { explorerItemFactory } from "../atoms/explorerItemFactory";
import { assert } from "evt/tools/typeSafety/assert";
import { allUniq } from "evt/tools/reducers/allUniq";
import memoize from "memoizee";
import { useTheme } from "@material-ui/core/styles";
import { useWindowInnerWidth } from "app/utils/hooks/useWindowInnerWidth";

export type Props = {
    visualRepresentationOfAFile: ExplorerItemProps["visualRepresentationOfAFile"];
    /** Assert all uniq */
    files: string[];
    /** Assert all uniq */
    directories: string[];
    onOpen(params: { kind: "file" | "directory"; basename: string; }): void;
    onBasenameChanged(params: { kind: "file" | "directory"; basename: string; newBasename: string; }): void;

    renameRequestBeingProcessed: { kind: "file" | "directory", basename: string } | undefined;

};



export function ExplorerItems(props: Props) {

    const {
        visualRepresentationOfAFile,
        files,
        directories,
        onOpen,
        onBasenameChanged,
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
            files.reduce(...allUniq()) &&
            directories.reduce(...allUniq()),
            "Can't have two file or directory with the same name"
        ),
        [files, directories]
    );

    const [selectedItemKey, setSelectedItemKey] = useState<string | undefined>(undefined);
    const [isSelectedItemBeingEdited, setIsSelectedItemBeingEdited] = useState(false);

    const onMouseEventFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ type, target }: Parameters<ExplorerItemProps["onMouseEvent"]>[0]) => {

                    switch (type) {
                        case "down":

                            const key = getKey({ kind, basename });

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

    const onBasenameChangedFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ newBasename }: Parameters<ExplorerItemProps["onBasenameChanged"]>[0]) =>
                    onBasenameChanged({ kind, basename, newBasename })
        ),
        [onBasenameChanged]
    );

    const standardizedWidth = useMemo(
        (): ExplorerItemProps["standardizedWidth"] => {

            if (windowInnerWidth > theme.breakpoints.width("md")) {

                return "big";

            }

            return "normal";

        },
        [windowInnerWidth, theme]
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
                    basename => {

                        const key = getKey({ kind, basename });
                        const isSelected = selectedItemKey === getKey({ kind, basename });

                        return (
                            <Grid item key={key}>
                                <ExplorerItem
                                    kind={kind}
                                    basename={basename}
                                    isSelected={isSelected}
                                    onMouseEvent={onMouseEventFactory(kind, basename)}
                                    onBasenameChanged={onBasenameChangedFactory(kind, basename)}
                                    isBeingEdited={isSelected && isSelectedItemBeingEdited}
                                    isRenameRequestBeingProcessed={renameRequestBeingProcessed?.basename === basename}
                                    standardizedWidth={standardizedWidth}
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
    basename: string
}): string {
    const { kind, basename } = params;
    return `${kind}${basename}`;
}