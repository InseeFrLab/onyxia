import { css } from "@emotion/css";
import { useState, useEffect } from "react";
import { ExplorerItems } from "ui/components/pages/MyFiles/Explorer/ExplorerItems/ExplorerItems";
import type { ExplorerItemsProps } from "ui/components/pages/MyFiles/Explorer/ExplorerItems/ExplorerItems";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import { symToStr } from "tsafe/symToStr";
import { Evt } from "evt";
import { EventEmitter } from "events";

const eventEmitter = new EventEmitter();

function Component(
    props: Omit<
        ExplorerItemsProps,
        "onEditedBasename" | "filesBeingRenamed" | "directoriesBeingRenamed" | "className"
    > & {
        containerWidth: number;
    }
) {
    const { containerWidth } = props;

    const [files, setFiles] = useState(props.files);
    const [directories, setDirectories] = useState(props.directories);

    useEffect(() => {
        setFiles(props.files);
    }, [props.files]);

    useEffect(() => {
        setDirectories(props.directories);
    }, [props.directories]);

    const [filesBeingRenamed, setFilesBeingRenamed] = useState<string[]>([]);

    const [directoriesBeingRenamed, setDirectoriesBeingRenamed] = useState<string[]>([]);

    const [toRemove, setToRemove] = useState<
        { kind: "directory" | "file"; basename: string } | undefined
    >(undefined);

    useEffect(() => {
        if (toRemove === undefined) {
            return;
        }

        const { kind, basename } = toRemove;

        const [beingRenamedItems, setBeingRenamedItems] = (() => {
            switch (kind) {
                case "directory":
                    return [directoriesBeingRenamed, setDirectoriesBeingRenamed] as const;
                case "file":
                    return [filesBeingRenamed, setFilesBeingRenamed] as const;
            }
        })();

        setBeingRenamedItems(
            beingRenamedItems.filter(basename_i => basename_i !== basename)
        );

        setToRemove(undefined);
    }, [toRemove, filesBeingRenamed, directoriesBeingRenamed]);

    return (
        <ExplorerItems
            {...props}
            className={css({ "width": `${containerWidth}vw` })}
            files={files}
            directories={directories}
        />
    );
}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ ExplorerItems })]: Component }
});

export default {
    ...meta,
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

export const View1 = getStory({
    "containerWidth": 500,
    "directoryBrowsingHasFailed": false,
    "files": [
        ...new Array(30).fill("").map((_, i) => `aaa${i}`),
        "this-is-a-file",
        "aFileWithAveryLongNameThatShouldNotOverlap.txt",
        "foo.csv"
    ],
    "directories": [
        "My_directory-1",
        "dir2",
        "another-directory",
        "another_directory_2",
        "My_directory-2",
        "dir3",
        "another-directory_1",
        "another_directory_3",
        "My_directory-3",
        "dir4",
        "another-directory_2",
        "another_directory_4",
        "My_directory-4",
        "dir5",
        "another-directory_3",
        "another_directory_5",
        "My_directory-5",
        "dir6",
        "another-directory_4",
        "another_directory_6"
    ],
    "evtAction": Evt.from(eventEmitter, "default"),
    "isNavigating": false,
    "filesBeingCreated": [],
    "directoriesBeingCreated": [],
    ...logCallbacks([
        "onNavigate",
        "onCopyPath",
        "onDeleteItem",
        "onEditBasename",
        "onSelectedItemKindValueChange",
        "onIsSelectedItemInEditingStateValueChange",
        "onOpenFile"
    ])
});
