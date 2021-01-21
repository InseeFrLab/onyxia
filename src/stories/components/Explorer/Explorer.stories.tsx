import { useState, useCallback, useEffect } from "react";
import { Explorer, Props } from "app/components/Explorer/Explorer";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { symToStr } from "app/utils/symToStr";
import { pure } from "lib/useCases/secretExplorer";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";
import { createStyles, makeStyles } from "@material-ui/core/styles";

type StoryProps = {
    width: number;
    height: number;
};

const useStyles = makeStyles(
    () => createStyles<"root", StoryProps>({
        "root": ({ width, height }) => ({
            "border": "1px solid black",
            width,
            height
        })
    })
);

function Component(props: Omit<Props, "onEditedBasename" | "filesBeingRenamed" | "directoriesBeingRenamed" | "onDeleteItem" | "className"> & StoryProps) {

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

    const classes = useStyles(props);

    return (
        <Explorer
            {...props}
            className={classes.root}
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

export const Vue1 = getStory({
    "type": "secret",
    "browsablePath": ".onyxia",
    "currentPath": ".onyxia/this/is/a/path",
    "evtTranslation": new Evt(),
    "isNavigating": false,
    "showHidden": false,
    "file": null,
    "files": ["this-is-a-file", "file2", "foo.csv"],
    "directories": ["My_directory-1", "dir2", "another-directory", "foo"],
    "getIsValidBasename": pure.getIsValidBasename,
    "filesBeingCreated": [],
    "directoriesBeingCreated": [],
    "height": 400,
    "width": 1100,
    "paddingLeftSpacing": 5,
    ...logCallbacks([
        "onNavigate",
        "onCopyPath",
        "onCreateItem",
        "onEditBasename"
    ])
});
