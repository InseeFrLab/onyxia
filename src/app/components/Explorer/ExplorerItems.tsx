
import React, { useMemo, useState, useCallback } from "react";
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
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { assert } from "evt/tools/typeSafety/assert";
import { useValueChangeEffect } from "app/utils/hooks/useValueChangeEffect";
import { useArrayDiff } from "app/utils/hooks/useArrayDiff";
import { useSemanticGuaranteeMemo } from "evt/tools/hooks/useSemanticGuaranteeMemo";


export type Props = {
    /** [HIGHER ORDER] */
    visualRepresentationOfAFile: ExplorerItemProps["visualRepresentationOfAFile"];
    /** [HIGHER ORDER] */
    getIsValidBasename(params: { basename: string; }): boolean;

    isNavigating: boolean;

    /** Assert all uniq */
    files: string[];
    /** Assert all uniq */
    directories: string[];

    directoriesBeingCreated: string[];
    directoriesBeingRenamed: string[];
    filesBeingCreated: string[];
    filesBeingRenamed: string[];

    onNavigate(params: { kind: "file" | "directory"; basename: string; }): void;
    onEditBasename(params: { kind: "file" | "directory"; basename: string; editedBasename: string; }): void;
    onDeleteItem(params: { kind: "file" | "directory"; basename: string }): void;
    onCopyPath(params: { basename: string }): void;
    /** Assert initial value is false */
    onIsThereAnItemSelectedValueChange(params: { isThereAnItemSelected: boolean; }): void;
    onIsSelectedItemInEditingStateValueChange(params: { isSelectedItemInEditingState: boolean; }): void;

    evtAction: NonPostableEvt<
        "START EDITING SELECTED ITEM BASENAME" |
        "DELETE SELECTED ITEM" |
        "COPY SELECTED ITEM PATH"
    >;

};


export function ExplorerItems(props: Props) {

    const {
        visualRepresentationOfAFile,
        getIsValidBasename,
        isNavigating,
        files,
        directories,
        onNavigate,
        onEditBasename,
        onDeleteItem,
        onCopyPath,
        directoriesBeingCreated,
        directoriesBeingRenamed,
        filesBeingCreated,
        filesBeingRenamed,
        evtAction,
        onIsThereAnItemSelectedValueChange,
        onIsSelectedItemInEditingStateValueChange
    } = props;

    const ExplorerItem = useSemanticGuaranteeMemo(
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

    useValueChangeEffect(
        isThereAnItemSelected => onIsThereAnItemSelectedValueChange({ isThereAnItemSelected }),
        [selectedItemKeyProp !== undefined]
    );

    const getEvtItemAction = useMemo(
        () => memoize(
            (_keyProp: string) => Evt.create<UnpackEvt<ExplorerItemProps["evtAction"]>>()
        ),
        []
    );

    useEvt(
        ctx => evtAction.attach(
            ctx,
            action => {
                switch (action) {
                    case "DELETE SELECTED ITEM":
                        assert(selectedItemKeyProp !== undefined);
                        onDeleteItem(getValuesCurrentlyMappedToKeyProp(selectedItemKeyProp));
                        break;
                    case "START EDITING SELECTED ITEM BASENAME":
                        assert(selectedItemKeyProp !== undefined);
                        getEvtItemAction(selectedItemKeyProp).post("ENTER EDITING STATE");
                        break;
                    case "COPY SELECTED ITEM PATH":
                        assert(selectedItemKeyProp !== undefined);
                        onCopyPath(getValuesCurrentlyMappedToKeyProp(selectedItemKeyProp));
                        break;
                }
            }
        ),
        [
            evtAction,
            onDeleteItem,
            onCopyPath,
            getEvtItemAction,
            selectedItemKeyProp,
            getValuesCurrentlyMappedToKeyProp
        ]
    );


    useValueChangeEffect(
        () => setSelectedItemKeyProp(undefined),
        [isNavigating]
    );

    // If selected item is removed, unselect it.
    {

        const callbackFactory = useMemo(
            () => memoize(
                (kind: "file" | "directory") =>
                    (params: { removed: string[]; }) => {

                        const { removed } = params;

                        if (selectedItemKeyProp === undefined) {
                            return;
                        }

                        const selectedItem = getValuesCurrentlyMappedToKeyProp(selectedItemKeyProp);

                        if (selectedItem.kind === kind && removed.includes(selectedItem.basename)) {
                            setIsSelectedItemInEditingState(false);
                            setSelectedItemKeyProp(undefined);
                        }

                    }
            ),
            [selectedItemKeyProp, getValuesCurrentlyMappedToKeyProp]
        );

        useArrayDiff({
            "watchFor": "deletion",
            "array": files,
            "callback": callbackFactory("file")
        });

        useArrayDiff({
            "watchFor": "deletion",
            "array": directories,
            "callback": callbackFactory("directory")
        });

    }

    // When an item is created automatically enter editing mode.
    {

        const callbackFactory = useMemo(
            () => memoize(
                (kind: "file" | "directory") =>
                    (params: { added: string[]; }) => {

                        const { added } = params;

                        if (added.length > 1) {
                            return;
                        }

                        const [basename] = added;

                        if (!(() => {
                            switch (kind) {
                                case "directory": return directoriesBeingCreated;
                                case "file": return filesBeingCreated;
                            }
                        })().includes(basename)) {
                            return;
                        }

                        const evtItemAction = getEvtItemAction(
                            getKeyProp({ kind, basename })
                        );

                        console.log("Enter editing state");

                        evtItemAction.post("ENTER EDITING STATE");

                    }
            ),
            [
                getEvtItemAction, getKeyProp,
                directoriesBeingCreated, filesBeingCreated
            ]
        );

        useArrayDiff({
            "watchFor": "addition",
            "array": files,
            "callback": callbackFactory("file")
        });

        useArrayDiff({
            "watchFor": "addition",
            "array": directories,
            "callback": callbackFactory("directory")
        });

    }

    const onMouseEventFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                async ({ type, target }: Parameters<ExplorerItemProps["onMouseEvent"]>[0]) => {

                    if (isNavigating) {
                        return;
                    }

                    switch (type) {
                        case "down":

                            const keyProp = getKeyProp({ kind, basename });

                            if (target === "text" && selectedItemKeyProp === keyProp) {

                                await Evt.from(window, "mouseup").waitFor();

                                getEvtItemAction(keyProp).post("ENTER EDITING STATE");

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
        [onNavigate, selectedItemKeyProp, getKeyProp, getEvtItemAction, isNavigating]
    );

    const [isSelectedItemInEditingState, setIsSelectedItemInEditingState] = useState(false);

    useValueChangeEffect(
        () => onIsSelectedItemInEditingStateValueChange({ isSelectedItemInEditingState }),
        [isSelectedItemInEditingState]
    );



    const onEditBasenameFactory = useMemo(
        () => memoize(
            (kind: "file" | "directory", basename: string) =>
                ({ editedBasename }: Parameters<ExplorerItemProps["onEditBasename"]>[0]) => {

                    transfersKeyProp({
                        "toValues": { kind, "basename": editedBasename },
                        "fromValues": { kind, basename }
                    });

                    onEditBasename({ kind, basename, editedBasename });

                }
        ),
        [onEditBasename, transfersKeyProp]
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

    const onIsInEditingStateValueChange = useCallback(
        ({ isInEditingState }: Parameters<ExplorerItemProps["onIsInEditingStateValueChange"]>[0]) =>
            setIsSelectedItemInEditingState(isInEditingState),
        []
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

                    const keyProp = getKeyProp({ kind, basename });
                    const isSelected = selectedItemKeyProp === keyProp;

                    return (
                        <Grid item key={keyProp}>
                            <ExplorerItem
                                kind={kind}
                                basename={basename}
                                isSelected={isSelected}
                                evtAction={getEvtItemAction(keyProp)}
                                isCircularProgressShown={
                                    (() => {
                                        switch (kind) {
                                            case "directory": return [
                                                ...directoriesBeingCreated,
                                                ...directoriesBeingRenamed
                                            ];
                                            case "file": return [
                                                ...filesBeingCreated,
                                                ...filesBeingRenamed
                                            ];
                                        }
                                    })().includes(basename)
                                }
                                standardizedWidth={standardizedWidth}
                                onMouseEvent={onMouseEventFactory(kind, basename)}
                                onEditBasename={onEditBasenameFactory(kind, basename)}
                                getIsValidBasename={getIsValidBasenameFactory(kind, basename)}
                                onIsInEditingStateValueChange={onIsInEditingStateValueChange}
                            />
                        </Grid>
                    );

                }))}

        </Grid>
    );

}
