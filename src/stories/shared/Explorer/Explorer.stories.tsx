
import { css } from "app/theme/useClassNames";
import { useState, useCallback, useEffect } from "react";
import { Explorer, Props } from "app/components/shared/Explorer/Explorer";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { symToStr } from "app/tools/symToStr";
import { pure } from "lib/useCases/secretExplorer";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";

function Component(props: Omit<Props, "onEditedBasename" | "filesBeingRenamed" | "directoriesBeingRenamed" | "onDeleteItem" | "className"> & {
    width: number;
    height: number;

}) {

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

    const [filesBeingRenamed, setFilesBeingRenamed] = useState<string[]>([]);

    const [directoriesBeingRenamed, setDirectoriesBeingRenamed] = useState<string[]>([]);


    const [toRemoveFromBeingEdited, setToRemoveFromBeingEdited] =
        useState<{ kind: "directory" | "file"; basename: string; } | undefined>(undefined);

    useEffect(
        () => {

            if (toRemoveFromBeingEdited === undefined) {
                return;
            }

            const { kind, basename } = toRemoveFromBeingEdited;

            const [beingRenamedItems, setBeingRenamedItems] = (() => {
                switch (kind) {
                    case "directory": return [directoriesBeingRenamed, setDirectoriesBeingRenamed] as const;
                    case "file": return [filesBeingRenamed, setFilesBeingRenamed] as const;
                }
            })();


            setBeingRenamedItems(beingRenamedItems.filter(basename_i => basename_i !== basename));

            setToRemoveFromBeingEdited(undefined);



        },
        [toRemoveFromBeingEdited, filesBeingRenamed, directoriesBeingRenamed]
    );

    const onEditedBasename = useCallback(
        ({ basename, editedBasename, kind }: Parameters<Props["onEditBasename"]>[0]) => {


            const [items, setItems, beingRenamedItems, setBeingRenamedItems] = (() => {
                switch (kind) {
                    case "directory": return [directories, setDirectories, directoriesBeingRenamed, setDirectoriesBeingRenamed] as const;
                    case "file": return [files, setFiles, filesBeingRenamed, setFilesBeingRenamed] as const;
                }
            })();

            items[items.indexOf(basename)!] = editedBasename;

            setItems([...items]);


            (async () => {

                setBeingRenamedItems([...beingRenamedItems, editedBasename]);

                if (basename !== editedBasename) {

                    await new Promise(resolve => setTimeout(resolve, 1000));

                }

                setToRemoveFromBeingEdited({ kind, "basename": editedBasename });

            })();

        },
        [files, directories, filesBeingRenamed, directoriesBeingRenamed]
    );

    const onDeleteItem = useCallback(
        ({ kind, basename }: Parameters<Props["onDeleteItem"]>[0]) => {

            const [items, setItems] = (() => {
                switch (kind) {
                    case "directory": return [directories, setDirectories] as const;
                    case "file": return [files, setFiles] as const;
                }
            })();

            setItems(items.filter(str => str !== basename));

        },
        [directories, files]
    );

    const { width, height } = props;

    return (
        <Explorer
            {...props}
            className={css({
                "border": "1px solid black",
                width,
                height
            })}
            files={files}
            directories={directories}
            filesBeingRenamed={filesBeingRenamed}
            directoriesBeingRenamed={directoriesBeingRenamed}
            onEditBasename={onEditedBasename}
            onDeleteItem={onDeleteItem}
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
        },
        "width": {
            "control": {
                "type": "range",
                "min": 300,
                "max": 1920
            }
        },
        "height": {
            "control": {
                "type": "range",
                "min": 100,
                "max": 1080
            }
        },
    }
};

const props: Parameters<typeof getStory>[0] = {
    "type": "secret",
    "browsablePath": ".onyxia",
    "currentPath": ".onyxia/this/is/a/path",
    "evtTranslation": new Evt(),
    "isNavigating": false,
    "showHidden": false,
    "file": null,
    "files": [
        "My_directory-3", "dir4", "another-directory_2", "another_directory_4",
        "My_directory-4", "dir5", "another-directory_3", "another_directory_5",
        "My_directory-5", "dir6", "another-directory_4", "another_directory_6",
        "My_directory-6", "dir7", "another-directory_5", "another_directory_7",
        "this-is-a-file", "file2", "foo.csv",
    ],
    "directories": [
        "My_directory-1", "dir2", "another-directory", "another_directory_2",
        "My_directory-2", "dir3", "another-directory_1", "another_directory_3",
        "My_directory-3", "dir4", "another-directory_2", "another_directory_4",
        "My_directory-4", "dir5", "another-directory_3", "another_directory_5",
        "My_directory-5", "dir6", "another-directory_4", "another_directory_6",
        "My_directory-6", "dir7", "another-directory_5", "another_directory_7",
    ],
    "getIsValidBasename": pure.getIsValidBasename,
    "filesBeingCreated": [],
    "directoriesBeingCreated": [],
    ...logCallbacks([
        "onNavigate",
        "onCopyPath",
        "onCreateItem",
        "onEditBasename"
    ]),
    "height": 1000,
    "width": 1600,
};

export const Vue1 = getStory(props);

export const VueShowingFile = getStory({
    ...props,
    "height": 500,
    "file":
        <div className={css({ 
            "backgroundColor": "blue",
            "border": "6px solid pink"
        })}>
            {new Array(500).fill("Lorem ipsum ").join(" ")}
            {/*file*/}
        </div>

});
