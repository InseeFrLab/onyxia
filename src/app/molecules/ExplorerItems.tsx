
import React, { useMemo, useState } from "react";
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

    const [selectedItemKey, setSelectedItemKey] = useState<string | undefined>(undefined);

    const onMouseEventFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ type }: { type: "down" | "double" }) => {
                    switch (type) {
                        case "down":
                            setSelectedItemKey(getKey({ kind, basename }));
                            break;
                        case "double":
                            onOpen({ kind, basename });
                            break;
                    }
                }
        ),
        [onOpen]
    );

    return (
        <Grid container wrap="wrap" justify="flex-start" spacing={1}>
            {(["directory", "file"] as const).map(
                kind => (kind === "directory" ? directories : files ).map(basename =>
                    <Grid item key={getKey({ kind, basename })} style={{ "width": "120px" }}>
                        <ExplorerItem
                            kind={kind}
                            basename={basename}
                            isSelected={selectedItemKey === getKey({ kind, basename })}
                            onMouseEvent={onMouseEventFactory(kind, basename)}
                        />
                    </Grid>
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