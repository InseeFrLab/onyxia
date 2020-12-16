
import React, { useMemo, useState, useEffect } from "react";
import Grid from '@material-ui/core/Grid';
import type { Props as ExplorerItemProps } from "./ExplorerItem";
import { ExplorerItem as SecretOrFileExplorerItem } from "./ExplorerItem";
import memoize from "memoizee";
import { useTheme } from "@material-ui/core/styles";
import { useWindowInnerWidth } from "app/utils/hooks/useWindowInnerWidth";
import { withProps } from "app/utils/withProps";
import { getKeyPropFactory } from "app/utils/getKeyProp";
import { useArrayRemoved } from "app/utils/hooks/useArrayRemoved";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";


export type Props = {
    /** [HIGHER ORDER] */
    visualRepresentationOfAFile: ExplorerItemProps["visualRepresentationOfAFile"];
    /** [HIGHER ORDER] */
    getIsValidBasename(params: { basename: string; }): boolean;

    /** Assert all uniq */
    files: string[];
    /** Assert all uniq */
    directories: string[];

    filesBeingCreatedOrRenamed: string[];
    directoriesBeingCreatedOrRenamed: string[];

    onNavigate(params: { kind: "file" | "directory"; basename: string; }): void;
    onEditedBasename(params: { kind: "file" | "directory"; basename: string; editedBasename: string; }): void;

    /** Fo signaling click on the button bar */
    evtStartEditing: NonPostableEvt<void>;

    onItemSelected(params: { kind: "file" | "directory"; getBasename(): string; } | undefined): void;


};


export function ExplorerItems(props: Props) {


    const {
        visualRepresentationOfAFile,
        getIsValidBasename,
        files,
        directories,
        onNavigate,
        onEditedBasename,
        directoriesBeingCreatedOrRenamed,
        filesBeingCreatedOrRenamed,
        evtStartEditing,
        onItemSelected
    } = props;

    /*
    assert(
        (
            files.reduce(...allUniq()) &&
            directories.reduce(...allUniq()) &&
            [...files, ...directories].every(basename => getIsValidBasename({ basename }))
        ),
        "Can't have two file or directory with the same name and all basename must be valid"
    );
    */

    const ExplorerItem = useMemo(
        () => withProps(SecretOrFileExplorerItem, { visualRepresentationOfAFile }),
        [visualRepresentationOfAFile]
    );

    const theme = useTheme();

    const { windowInnerWidth } = useWindowInnerWidth();

    const standardizedWidth = useMemo(
        (): ExplorerItemProps["standardizedWidth"] => {

            if (windowInnerWidth > theme.breakpoints.width("md")) {

                return "big";

            }

            return "normal";

        },
        [windowInnerWidth, theme]
    );


    const [{
        getKeyProp,
        transfersKeyProp,
        getValuesCurrentlyMappedToKeyProp
    }] = useState(
        () => getKeyPropFactory<{
            kind: "directory" | "file";
            basename: string;
        }>()
    );

    const [selectedItemKey, setSelectedItemKey] = useState<string | undefined>(undefined);

    useEffect(() => {
        onItemSelected(
            selectedItemKey === undefined ?
                undefined :
                (() => {

                    const getValues = () => getValuesCurrentlyMappedToKeyProp(selectedItemKey);

                    const { kind } = getValues();

                    return { kind, "getBasename": () => getValues().basename };

                })()
        );
    }, [onItemSelected, selectedItemKey, getValuesCurrentlyMappedToKeyProp]);


    const [isSelectedItemBeingEdited, setIsSelectedItemBeingEdited] = useState(false);

    useEvt(ctx => {
        evtStartEditing.attach(ctx, () => setIsSelectedItemBeingEdited(true));
    }, [evtStartEditing]);


    const onMouseEventFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ type, target }: Parameters<ExplorerItemProps["onMouseEvent"]>[0]) => {

                    switch (type) {
                        case "down":

                            const key = getKeyProp({ kind, basename });

                            if (target === "text" && selectedItemKey === key) {

                                setIsSelectedItemBeingEdited(true);

                                break;

                            } else {

                                setIsSelectedItemBeingEdited(false);

                            }

                            setSelectedItemKey(key);

                            break;

                        case "double":
                            setIsSelectedItemBeingEdited(false);
                            onNavigate({ kind, basename });
                            break;
                    }
                }
        ),
        [onNavigate, selectedItemKey, getKeyProp]
    );


    const onEditedBasenameFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ editedBasename }: Parameters<ExplorerItemProps["onEditedBasename"]>[0]) => {

                    transfersKeyProp({
                        "toValues": { kind, "basename": editedBasename },
                        "fromValues": { kind, basename }
                    });

                    onEditedBasename({ kind, basename, editedBasename });

                }
        ),
        [onEditedBasename, transfersKeyProp]
    );

    {

        const useArrayRemovedCallbackFactory = useMemo(
            () => memoize(
                (kind: "file" | "directory") =>
                    (removed: string[]) => {

                        if (selectedItemKey === undefined) {
                            return;
                        }

                        const {
                            kind: selectedItemKind,
                            basename
                        } = getValuesCurrentlyMappedToKeyProp(selectedItemKey);

                        if (
                            selectedItemKind !== kind ||
                            !removed.includes(basename)
                        ) {
                            return;
                        }

                        setIsSelectedItemBeingEdited(false);

                    }
            ),
            [selectedItemKey, getValuesCurrentlyMappedToKeyProp]
        );

        useArrayRemoved({
            "array": directoriesBeingCreatedOrRenamed,
            "callback": useArrayRemovedCallbackFactory("directory")
        });

        useArrayRemoved({
            "array": filesBeingCreatedOrRenamed,
            "callback": useArrayRemovedCallbackFactory("file")
        });

    }


    const getIsValidBasenameFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ basename: candidateBasename }: Parameters<ExplorerItemProps["getIsValidBasename"]>[0]) => {

                    if (basename === candidateBasename) {
                        return true;
                    }

                    if (
                        (() => {
                            switch (kind) {
                                case "directory": return directories;
                                case "file": return files;
                            }
                        })().includes(candidateBasename)
                    ) {
                        return false;
                    }

                    return getIsValidBasename({ "basename": candidateBasename });

                }
        ),
        [getIsValidBasename, directories, files]
    );


    return (
        <Grid container wrap="wrap" justify="flex-start" spacing={1}>
            {(["directory", "file"] as const).map(
                kind => ((() => {
                    switch (kind) {
                        case "directory": return directories;
                        case "file": return files;
                    }
                })()).map(basename => {

                    const key = getKeyProp({ kind, basename });
                    const isSelected = selectedItemKey === key;

                    return (
                        <Grid item key={key}>
                            <ExplorerItem
                                kind={kind}
                                basename={basename}
                                isSelected={isSelected}
                                isBeingEdited={isSelected && isSelectedItemBeingEdited}
                                isCircularProgressShown={(() => {
                                    switch (kind) {
                                        case "directory": return directoriesBeingCreatedOrRenamed;
                                        case "file": return filesBeingCreatedOrRenamed;
                                    }
                                })().includes(basename)}
                                standardizedWidth={standardizedWidth}
                                onMouseEvent={onMouseEventFactory(kind, basename)}
                                onEditedBasename={onEditedBasenameFactory(kind, basename)}
                                getIsValidBasename={getIsValidBasenameFactory(kind, basename)}
                            />
                        </Grid>
                    );

                }))}

        </Grid>
    );

}
