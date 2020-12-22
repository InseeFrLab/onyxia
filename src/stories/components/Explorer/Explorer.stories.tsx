

import { useState, useCallback, useEffect } from "react";
import { Explorer, Props } from "app/components/Explorer/Explorer";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { symToStr } from "app/utils/symToStr";
import { pure } from "lib/useCases/secretExplorer";
import { id } from "evt/tools/typeSafety/id";


function Component(props: Omit<Props, "onEditedBasename" | "filesBeingCreatedOrRenamed" | "directoriesBeingCreatedOrRenamed">) {


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


    const [toRemove, setToRemove] = useState<{ kind: "directory" | "file"; basename: string; } | undefined>(undefined);

    useEffect(
        () => {

            if (toRemove === undefined) {
                return;
            }

            const { kind, basename } = toRemove;

            const [beingRenamedItems, setBeingRenamedItems] = (() => {
                switch (kind) {
                    case "directory": return [directoriesBeingCreatedOrRenamed, setDirectoriesBeingCreatedOrRenamed] as const;
                    case "file": return [filesBeingCreatedOrRenamed, setFilesBeingCreatedOrRenamed] as const;
                }
            })();


            setBeingRenamedItems(beingRenamedItems.filter(basename_i => basename_i !== basename));

            setToRemove(undefined);



        },
        [toRemove, filesBeingCreatedOrRenamed, directoriesBeingCreatedOrRenamed]
    );

    const onEditedBasename = useCallback(
        ({ basename, editedBasename, kind }: Parameters<Props["onEditBasename"]>[0]) => {


            const [items, setItems, beingRenamedItems, setBeingRenamedItems] = (() => {
                switch (kind) {
                    case "directory": return [directories, setDirectories, directoriesBeingCreatedOrRenamed, setDirectoriesBeingCreatedOrRenamed] as const;
                    case "file": return [files, setFiles, filesBeingCreatedOrRenamed, setFilesBeingCreatedOrRenamed] as const;
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
        [files, directories, filesBeingCreatedOrRenamed, directoriesBeingCreatedOrRenamed]
    );

    return (
        <Explorer
            {...props}
            files={files}
            directories={directories}
            filesBeingCreatedOrRenamed={filesBeingCreatedOrRenamed}
            directoriesBeingCreatedOrRenamed={directoriesBeingCreatedOrRenamed}
            onEditBasename={onEditedBasename}
        />
    );

}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ Explorer })]: Component }
});

export default {
    ...meta,
    "argTypes": {
        ...meta.argTypes,
        "type": {
            "control": {
                "type": "inline-radio",
                "options": id<Props["type"][]>(["file", "secret"]),
            }
        }
    }
};

export const Vue1 = getStory({
    "type": "secret",
    "currentPath": ".onyxia/this/is/a/path",
    "isNavigating": false,
    "file": <h1>Representation of a file</h1>,
    "files": ["this-is-a-file", "file2", "foo.csv"],
    "directories": ["My_directory-1", "dir2", "another-directory", "foo"],
    "getIsValidBasename": pure.getIsValidBasename,
    "onNavigate": console.log.bind(console, "onNavigate"),
    "onCopyPath": console.log.bind(console, "onCopyPath"),
    "onDeleteItem": console.log.bind(console, "onDeleteItem"),
    "onCreateItem": console.log.bind(console, "onCreateItem"),
    "onEditBasename": console.log.bind(console, "onEditBasename"),
});
