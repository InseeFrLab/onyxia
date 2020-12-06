
import React, { useMemo } from "react";
import Grid from '@material-ui/core/Grid';
import type { Props as ExporterItemProps } from "../atoms/ExplorerItem";
import { explorerItemFactory } from "../atoms/explorerItemFactory";
import { assert } from "evt/tools/typeSafety/assert";
import { allUniq } from "evt/tools/reducers/allUniq";
import memoize from "memoizee";

export type Props = {
    visualRepresentationOfAFile: ExporterItemProps["visualRepresentationOfAFile"];
    /** Assert all uniq */
    files: string[];
    /** Assert all uniq */
    directories: string[];
    onOpen(params: { kind: "file" | "directory"; basename: string; }): void;
};

export function ExplorerItems(props: Props) {

    const { visualRepresentationOfAFile, files, directories, onOpen } = props;

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

    const onClickFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                () => onOpen({ kind, basename })
        ),
        [onOpen]
    );

    return (
        <Grid container spacing={5}>
            { directories.map(basename =>
                <Grid item key={"d" + basename}>
                    <ExplorerItem
                        kind="directory"
                        basename={basename}
                        isSelected={false}
                        onClick={onClickFactory("directory", basename)}
                        
                    />
                </Grid>
            )}
            {files.map(basename =>
                <Grid item key={"f" + basename}>
                    <ExplorerItem
                        kind="file"
                        basename={basename}
                        isSelected={false}
                        onClick={onClickFactory("file", basename)}
                    />
                </Grid>
            )}
        </Grid>
    );

}