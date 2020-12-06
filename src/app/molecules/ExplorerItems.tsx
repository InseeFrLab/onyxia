
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

    const onClickFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ type }: { type: "simple" | "double" }) => {
                    switch (type) {
                        case "simple":
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

        /*
        <Grid container spacing={5}>
            {(["directory", "file"] as const).map(
                kind => directories.map(basename =>
                    <Grid item key={getKey({ kind, basename })}>
                        <ExplorerItem
                            kind={kind}
                            basename={basename}
                            isSelected={selectedItemKey === getKey({ kind, basename })}
                            onClick={onClickFactory(kind, basename)}
                        />
                    </Grid>
                ))}
        </Grid>
                */

    return (
        <div style={{ "display": "flex", "flexWrap": "wrap", "justifyContent": "flex-start" }}>
            {(["directory", "file"] as const).map(
                kind => (kind === "directory" ? directories : files ).map(basename =>
                    <Grid item key={getKey({ kind, basename })} style={{ "width": "120px", "border": "1px solid black" }}>
                        <ExplorerItem
                            kind={kind}
                            basename={basename}
                            isSelected={selectedItemKey === getKey({ kind, basename })}
                            onClick={onClickFactory(kind, basename)}
                        />
                    </Grid>
                ))}

        </div>
    );

}

function getKey(params: {
    kind: "file" | "directory",
    basename: string
}): string {
    const { kind, basename } = params;
    return `${kind}${basename}`;
}