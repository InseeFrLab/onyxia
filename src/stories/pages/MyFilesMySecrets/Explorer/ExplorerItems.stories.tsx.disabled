import { css } from "tss-react/@emotion/css";
import { useState, useCallback, useEffect } from "react";
import { ExplorerItems, Props } from "ui/components/shared/Explorer/ExplorerItems";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import { symToStr } from "tsafe/symToStr";
import { Evt } from "evt";
import { id } from "tsafe/id";
import { EventEmitter } from "events";
import withEvents from "@storybook/addon-events";
import type { UnpackEvt } from "evt";

const eventEmitter = new EventEmitter();

function Component(
    props: Omit<
        Props,
        "onEditedBasename" | "filesBeingRenamed" | "directoriesBeingRenamed" | "className"
    > & {
        containerWidth: number;
    },
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
            beingRenamedItems.filter(basename_i => basename_i !== basename),
        );

        setToRemove(undefined);
    }, [toRemove, filesBeingRenamed, directoriesBeingRenamed]);

    const onEditedBasename = useCallback(
        ({ basename, editedBasename, kind }: Parameters<Props["onEditBasename"]>[0]) => {
            const [items, setItems, beingRenamedItems, setBeingRenamedItems] = (() => {
                switch (kind) {
                    case "directory":
                        return [
                            directories,
                            setDirectories,
                            directoriesBeingRenamed,
                            setDirectoriesBeingRenamed,
                        ] as const;
                    case "file":
                        return [
                            files,
                            setFiles,
                            filesBeingRenamed,
                            setFilesBeingRenamed,
                        ] as const;
                }
            })();

            items[items.indexOf(basename)!] = editedBasename;

            setItems([...items]);

            (async () => {
                setBeingRenamedItems([...beingRenamedItems, editedBasename]);

                if (basename !== editedBasename) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                setToRemove({ kind, "basename": editedBasename });
            })();
        },
        [files, directories, filesBeingRenamed, directoriesBeingRenamed],
    );

    return (
        <ExplorerItems
            {...props}
            className={css({ "width": `${containerWidth}vw` })}
            files={files}
            directories={directories}
            filesBeingRenamed={filesBeingRenamed}
            directoriesBeingRenamed={directoriesBeingRenamed}
            onEditBasename={onEditedBasename}
        />
    );
}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ ExplorerItems })]: Component },
});

export default {
    ...meta,
    "argTypes": {
        ...meta.argTypes,
        "containerWidth": {
            "control": {
                "type": "range",
                "min": 10,
                "max": 100,
            },
        },
        "visualRepresentationOfAFile": {
            "control": {
                "type": "inline-radio",
                "options": id<Props["visualRepresentationOfAFile"][]>(["file", "secret"]),
            },
        },
    },
    "decorators": [
        ...(meta.decorators ? meta.decorators : []),
        withEvents({
            "emit": eventEmitter.emit.bind(eventEmitter),
            "events": [
                {
                    "title": "Start editing selected item",
                    "name": "default",
                    "payload": id<UnpackEvt<Props["evtAction"]>>(
                        "START EDITING SELECTED ITEM BASENAME",
                    ),
                },
                {
                    "title": "Delete selected item",
                    "name": "default",
                    "payload": id<UnpackEvt<Props["evtAction"]>>("DELETE SELECTED ITEM"),
                },
                {
                    "title": "Copy selected item path",
                    "name": "default",
                    "payload": id<UnpackEvt<Props["evtAction"]>>(
                        "COPY SELECTED ITEM PATH",
                    ),
                },
            ],
        }),
    ],
};

export const Vue1 = getStory({
    "containerWidth": 500,
    "visualRepresentationOfAFile": "secret",
    "getIsValidBasename": () => true,
    "files": [
        ...new Array(30).fill("").map((_, i) => `aaa${i}`),
        "this-is-a-file",
        "aFileWithAveryLongNameThatShouldNotOverlap.txt",
        "foo.csv",
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
        "another_directory_6",
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
    ]),
});
