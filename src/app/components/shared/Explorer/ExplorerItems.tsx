

import { useMemo, useState, useRef, memo } from "react";
import Grid from '@material-ui/core/Grid';
import type { Props as ExplorerItemProps } from "./ExplorerItem";
import { ExplorerItem as SecretOrFileExplorerItem } from "./ExplorerItem";
import { useWindowInnerSize } from "app/tools/hooks/useWindowInnerSize";
import { getKeyPropFactory } from "app/tools/getKeyProp";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { assert } from "evt/tools/typeSafety/assert";
import { useValueChangeEffect } from "app/tools/hooks/useValueChangeEffect";
import { useArrayDiff } from "app/tools/hooks/useArrayDiff";
import { Typography } from "app/components/designSystem/Typography";
import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "app/tools/hooks/useCallbackFactory";
import { useConstCallback } from "app/tools/hooks/useConstCallback";
import { useWithProps } from "app/tools/hooks/useWithProps";
import memoize from "memoizee";
import { useTheme } from "app/theme/useClassNames";


export type Props = {

    className?: string;

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

    /** Assert initial value is none */
    onSelectedItemKindValueChange(params: { selectedItemKind: "file" | "directory" | "none" }): void;

    onIsSelectedItemInEditingStateValueChange(params: { isSelectedItemInEditingState: boolean; }): void;

    evtAction: NonPostableEvt<
        "START EDITING SELECTED ITEM BASENAME" |
        "DELETE SELECTED ITEM" |
        "COPY SELECTED ITEM PATH"
    >;

};


export const ExplorerItems = memo((props: Props) => {

    const {
        className,
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
        onSelectedItemKindValueChange,
        onIsSelectedItemInEditingStateValueChange
    } = props;

    const ExplorerItem = useWithProps(
        SecretOrFileExplorerItem,
        { visualRepresentationOfAFile }
    );


    const theme = useTheme();

    const { windowInnerWidth } = useWindowInnerSize();

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
        selectedItemKind => onSelectedItemKindValueChange({ selectedItemKind }),
        [
            useMemo(
                () => selectedItemKeyProp === undefined ?
                    "none" as const :
                    getValuesCurrentlyMappedToKeyProp(selectedItemKeyProp).kind,
                [selectedItemKeyProp, getValuesCurrentlyMappedToKeyProp]
            )
        ]
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
        () => {
            setIsSelectedItemInEditingState(false);
            setSelectedItemKeyProp(undefined);
        },
        [isNavigating]
    );

    // If selected item is removed, unselect it.
    {

        const callbackFactory = useCallbackFactory(
            ([kind]: ["file" | "directory"], [params]: [{ removed: string[]; }]) => {

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


        const callbackFactory = useCallbackFactory(
            ([kind]: ["file" | "directory"], [params]: [{ added: string[]; }]) => {

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


                evtItemAction.post("ENTER EDITING STATE");
            }
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


    const onMouseEventFactory = useCallbackFactory(
        async (
            [kind, basename]: ["file" | "directory", string],
            [{ type, target }]: [Parameters<ExplorerItemProps["onMouseEvent"]>[0]]
        ) => {

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
    );


    const [isSelectedItemInEditingState, setIsSelectedItemInEditingState] = useState(false);

    useValueChangeEffect(
        () => onIsSelectedItemInEditingStateValueChange({ isSelectedItemInEditingState }),
        [isSelectedItemInEditingState]
    );


    const onEditBasenameFactory = useCallbackFactory(
        (
            [kind, basename]: ["file" | "directory", string],
            [{ editedBasename }]: [Parameters<ExplorerItemProps["onEditBasename"]>[0]]
        ) => {
            transfersKeyProp({
                "toValues": { kind, "basename": editedBasename },
                "fromValues": { kind, basename }
            });

            onEditBasename({ kind, basename, editedBasename });
        }
    );

    const getIsValidBasenameFactory = useCallbackFactory(
        (
            [kind, basename]: ["file" | "directory", string],
            [{ basename: candidateBasename }]: [Parameters<ExplorerItemProps["getIsValidBasename"]>[0]]
        ) => {

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
    );



    const onIsInEditingStateValueChange = useConstCallback(
        ({ isInEditingState }: Parameters<ExplorerItemProps["onIsInEditingStateValueChange"]>[0]) =>
            setIsSelectedItemInEditingState(isInEditingState)
    );

    const containerRef = useRef<HTMLDivElement>(null);

    const onGridMouseDown = useConstCallback(
        ({ target }: React.MouseEvent<HTMLDivElement, MouseEvent>) => {

            if (
                containerRef.current !== target &&
                !Array.from(containerRef.current!.children).includes(target as any)
            ) {
                return;
            }

            setIsSelectedItemInEditingState(false);
            setSelectedItemKeyProp(undefined);

        }
    );

    const { t } = useTranslation("ExplorerItems");

    return (
        <div
            className={className}
            ref={containerRef}
            onMouseDown={onGridMouseDown}
        >
            {
                files.length === 0 && directories.length === 0 ?
                    <Typography>{t("empty directory")}</Typography>
                    :
                    <Grid
                        container
                        wrap="wrap"
                        justify="flex-start"
                        spacing={1}
                    >
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
            }
        </div>
    );


});

export declare namespace ExplorerItems {
    export type I18nScheme = {
        'empty directory': undefined;
    };
}
