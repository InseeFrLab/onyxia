

import React, { useState, useCallback, useEffect } from "react";
import { ExplorerItems, Props } from "app/molecules/ExplorerItems";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default {
    ...buildMeta({
        sectionName,
        "wrappedComponent": { ExplorerItems }
    }),
    // https://storybook.js.org/docs/react/essentials/controls
    "argTypes": {
        "containerWidth": {
            "control": "range",
            "min": 10,
            "max": 100
        }
    }
};

const { getThemedStory } = getThemedStoryFactory(
    (props: Omit<Props, "onBasenameChanged" | "renameRequestBeingProcessed"> & { containerWidth: number; }) => {

        const [files, setFiles] = useState(props.files);
        const [directories, setDirectories] = useState(props.directories);

        useEffect(
            () => { setFiles(props.files); },
            [props.files]
        );

        useEffect(
            () => { setDirectories(props.directories); },
            [props.directories]
        );

        const [renameRequestBeingProcessed, setRenameRequestBeingProcessed] = useState<Props["renameRequestBeingProcessed"]>(undefined);

        const onBasenameChanged = useCallback(
            ({ basename, newBasename, kind }: Parameters<Props["onBasenameChanged"]>[0]) => {

                console.log({ basename, newBasename, kind });

                {

                    const [items, setItems] = (() => {
                        switch (kind) {
                            case "directory": return [directories, setDirectories] as const;
                            case "file": return [files, setFiles] as const;
                        }
                    })();

                    setItems((items[items.indexOf(basename)!] = newBasename, items));

                }

                (async () => {

                    setRenameRequestBeingProcessed({ kind, "basename": newBasename });

                    await new Promise(resolve => setTimeout(resolve, 1000));

                    setRenameRequestBeingProcessed(undefined);

                })();

            },
            [files, directories]
        );

        return (
            <div style={{ width: `${props.containerWidth}vw` }}>
                <ExplorerItems
                    {...props}
                    files={files}
                    directories={directories}
                    renameRequestBeingProcessed={renameRequestBeingProcessed}
                    onBasenameChanged={onBasenameChanged}
                />
            </div>
        )

    }
);


export const Vue1 = getThemedStory({
    "containerWidth": 50,
    "visualRepresentationOfAFile": "secret",
    "directories": ["My directory 1", "dir2", "another directory", "foo"],
    "files": ["this is a file", "file2", "foo.csv"],
    "onOpen": console.log
});
