

import React, { useState, useCallback, useEffect } from "react";
import { ExplorerItems, Props } from "app/components/Explorer/ExplorerItems";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { symToStr } from "app/utils/symToStr";


function Component(props: Omit<Props, "onBasenameChanged" | "renameRequestBeingProcessed"> & { containerWidth: number; }) {

    const { containerWidth } = props;

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

    const onEditedBasename = useCallback(
        ({ basename, editedBasename, kind }: Parameters<Props["onEditedBasename"]>[0]) => {

            {

                const [items, setItems] = (() => {
                    switch (kind) {
                        case "directory": return [directories, setDirectories] as const;
                        case "file": return [files, setFiles] as const;
                    }
                })();

                items[items.indexOf(basename)!] = editedBasename;

                setItems([...items]);

            }

            (async () => {

                setRenameRequestBeingProcessed({ kind, "basename": editedBasename });

                await new Promise(resolve => setTimeout(resolve, 1000));

                setRenameRequestBeingProcessed(undefined);

            })();

        },
        [files, directories]
    );

    return (
        <div style={{ "width": `${containerWidth}vw` }}>
            <ExplorerItems
                {...props}
                files={files}
                directories={directories}
                renameRequestBeingProcessed={renameRequestBeingProcessed}
                onEditedBasename={onEditedBasename}
            />
        </div>
    )

}

const { meta, getThemedStory } = getThemedStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ ExplorerItems })]: Component }
});

export default {
    meta,
    // https://storybook.js.org/docs/react/essentials/controls
    "argTypes": {
        "containerWidth": {
            "control": "range",
            "min": 10,
            "max": 100
        }
    }
};


export const Vue1 = getThemedStory({
    "containerWidth": 50,
    "visualRepresentationOfAFile": "secret",
    "directories": ["My_directory-1", "dir2", "another-directory", "foo"],
    "files": ["this-is-a-file", "file2", "foo.csv"],
    "onOpen": console.log,
    "getIsValidBasename": ({ basename }) => basename.indexOf(" ") < 0,
    "onEditedBasename": console.log.bind("onEditedBasename")
});
