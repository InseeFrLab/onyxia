
import React, { useMemo, useState } from "react";
import Grid from '@material-ui/core/Grid';
import type { Props as ExplorerItemProps } from "../atoms/ExplorerItem";
import { explorerItemFactory } from "../atoms/explorerItemFactory";
import { assert } from "evt/tools/typeSafety/assert";
import { allUniq } from "evt/tools/reducers/allUniq";
import memoize from "memoizee";
import { makeStyles, createStyles } from "@material-ui/core/styles";

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

const useStyles = makeStyles(
    theme => createStyles({
        "gridItem": {
            "width": theme.spacing(10),
            [theme.breakpoints.up("md")]: {
                "width": theme.spacing(15)
            }
        }
    })
);


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

    useMemo(
        () => assert(
            files.reduce(...allUniq()) &&
            directories.reduce(...allUniq()),
            "Can't have two file or directory with the same name"
        ),
        [files, directories]
    );

    const [selectedItemKey, setSelectedItemKey] = useState<string | undefined>(undefined);
    const [isSelectedItemBeingEdited, setIsSelectedItemBeingEdited]= useState(false);

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

                            }else{

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

    const classes = useStyles(props);

    return (
        <Grid container wrap="wrap" justify="flex-start" spacing={1}>
            {(["directory", "file"] as const).map(
                kind => (kind === "directory" ? directories : files).map(basename => {

                    const key = getKey({ kind, basename });
                    const isSelected = selectedItemKey === getKey({ kind, basename });

                    return (
                        <Grid item key={key} className={classes.gridItem}>
                            <ExplorerItem
                                kind={kind}
                                basename={basename}
                                isSelected={isSelected}
                                onMouseEvent={onMouseEventFactory(kind, basename)}
                                onBasenameChanged={onBasenameChangedFactory(kind, basename)}
                                isBeingEdited={isSelected && isSelectedItemBeingEdited}
                                isRenameRequestBeingProcessed={renameRequestBeingProcessed?.basename === basename}
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