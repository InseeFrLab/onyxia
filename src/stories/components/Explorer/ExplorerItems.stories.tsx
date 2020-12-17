

import React, { useState, useCallback, useEffect } from "react";
import { ExplorerItems, Props } from "app/components/Explorer/ExplorerItems";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { symToStr } from "app/utils/symToStr";
import { pure } from "lib/useCases/secretExplorer";
import { Evt } from "evt";


function Component(props: Omit<Props, "onEditedBasename" | "filesBeingCreatedOrRenamed" | "directoriesBeingCreatedOrRenamed"> & { containerWidth: number; }) {

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

    const [filesBeingCreatedOrRenamed, setFilesBeingCreatedOrRenamed] = useState<string[]>([]);

    const [directoriesBeingCreatedOrRenamed, setDirectoriesBeingCreatedOrRenamed] = useState<string[]>([]);

    const onEditedBasename = useCallback(
        ({ basename, editedBasename, kind }: Parameters<Props["onEditedBasename"]>[0]) => {


            const [items, setItems, renamedItems, setRenamedItems] = (() => {
                switch (kind) {
                    case "directory": return [directories, setDirectories, directoriesBeingCreatedOrRenamed, setDirectoriesBeingCreatedOrRenamed] as const;
                    case "file": return [files, setFiles, filesBeingCreatedOrRenamed, setFilesBeingCreatedOrRenamed] as const;
                }
            })();

            items[items.indexOf(basename)!] = editedBasename;

            setItems([...items]);


            (async () => {

                setRenamedItems([...renamedItems, editedBasename]);

                await new Promise(resolve => setTimeout(resolve, 1000));

                setRenamedItems(renamedItems.filter(name => name !== editedBasename));


            })();

        },
        [files, directories, filesBeingCreatedOrRenamed, directoriesBeingCreatedOrRenamed]
    );

    return (
        <div style={{ "width": `${containerWidth}vw` }}>
            <ExplorerItems
                {...props}
                files={files}
                directories={directories}
                filesBeingCreatedOrRenamed={filesBeingCreatedOrRenamed}
                directoriesBeingCreatedOrRenamed={directoriesBeingCreatedOrRenamed}
                onEditedBasename={onEditedBasename}
            />
        </div>
    )

}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ ExplorerItems })]: Component }
});


export default {
    ...meta,
    // https://storybook.js.org/docs/react/essentials/controls
    "argTypes": {
        ...meta.argTypes,
        "containerWidth": {
            "control": {
                "type": "range",
                "min": 10,
                "max": 100
            }
        }
    }
};


export const Vue1 = getStory({
    "containerWidth": 50,
    "visualRepresentationOfAFile": "secret",
    "getIsValidBasename": pure.getIsValidBasename,
    "files": ["this-is-a-file", "file2", "foo.csv"],
    "directories": ["My_directory-1", "dir2", "another-directory", "foo"],
    "onNavigate": console.log.bind(null,"onNavigate"),
    "evtStartEditing": Evt.create(),
    "onItemSelected": console.log.bind(null,"onItemSelected")
});
