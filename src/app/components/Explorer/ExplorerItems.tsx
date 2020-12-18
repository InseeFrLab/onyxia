
import React, { useMemo, useState, useEffect, useCallback } from "react";
import Grid from '@material-ui/core/Grid';
import type { Props as ExplorerItemProps } from "./ExplorerItem";
import { ExplorerItem as SecretOrFileExplorerItem } from "./ExplorerItem";
import memoize from "memoizee";
import { useTheme } from "@material-ui/core/styles";
import { useWindowInnerWidth } from "app/utils/hooks/useWindowInnerWidth";
import { withProps } from "app/utils/withProps";
import { getKeyPropFactory } from "app/utils/getKeyProp";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";


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

    const [
        selectedItemKeyProp, 
        setSelectedItemKeyProp
    ] = useState<string | undefined>(undefined);

    useEffect(() => {
        onItemSelected(
            selectedItemKeyProp === undefined ?
                undefined :
                (() => {

                    const getValues = () => getValuesCurrentlyMappedToKeyProp(selectedItemKeyProp);

                    const { kind } = getValues();
                    
                    //NOTE: The kind of the selected item is not susceptible to
                    //change, (a directory will always de a directory and a file
                    //will always be a file) but the item can be renamed.
                    return { kind, "getBasename": () => getValues().basename };

                })()
        );
    }, [onItemSelected, selectedItemKeyProp, getValuesCurrentlyMappedToKeyProp]);

    useEvt(
        ctx =>
            evtStartEditing.attach(
                ctx,
                () => {
                    if (selectedItemKeyProp === undefined) {
                        return;
                    }
                    getItemEvtAction(selectedItemKeyProp!)
                        .post({ "action": "enter editing state" });
                }
            ),
        [evtStartEditing]
    );

    const getItemEvtAction = useMemo(
        () => memoize(
            (_keyProp: string) => Evt.create<UnpackEvt<ExplorerItemProps["evtAction"]>>()
        ),
        []
    );

    const onMouseEventFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ type, target }: Parameters<ExplorerItemProps["onMouseEvent"]>[0]) => {

                    //TODO: Any click should do that, not only a click on an other item
                    if (selectedItemKeyProp !== undefined) {

                        getItemEvtAction(selectedItemKeyProp).post({
                            "action": "leave editing state",
                            "isCancel": false
                        });

                    }

                    switch (type) {
                        case "down":

                            const keyProp = getKeyProp({ kind, basename });

                            if (target === "text" && selectedItemKeyProp === keyProp) {

                                getItemEvtAction(keyProp).post({
                                    "action": "enter editing state"
                                });

                                break;

                            } 

                            setSelectedItemKeyProp(keyProp);

                            break;

                        case "double":
                            onNavigate({ kind, basename });
                            break;
                    }
                }
        ),
        [onNavigate, selectedItemKeyProp, getKeyProp, getItemEvtAction]
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



    const onKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {

            if (selectedItemKeyProp === undefined) {
                return;
            }

            const key = (() => {
                switch (event.key) {
                    case "Escape":
                    case "Enter":
                        return event.key;
                    default: return "irrelevant";
                }
            })();

            if (key === "irrelevant") {
                return;
            }

            getItemEvtAction(selectedItemKeyProp).post({
                "action": "leave editing state",
                "isCancel": (() => {
                    switch (key) {
                        case "Escape": return true;
                        case "Enter": return false;
                    }
                })()
            });

        },
        [getItemEvtAction, selectedItemKeyProp]
    );


    return (
        <Grid container wrap="wrap" justify="flex-start" spacing={1} onKeyDown={onKeyDown}>
            {(["directory", "file"] as const).map(
                kind => ((() => {
                    switch (kind) {
                        case "directory": return directories;
                        case "file": return files;
                    }
                })()).map(basename => {

                    const keyProp = getKeyProp({ kind, basename });
                    const isSelected = selectedItemKeyProp === keyProp;

                    return (
                        <Grid item key={keyProp}>
                            <ExplorerItem
                                kind={kind}
                                basename={basename}
                                isSelected={isSelected}
                                evtAction={getItemEvtAction(keyProp)}
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
