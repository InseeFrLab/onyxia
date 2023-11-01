import { useMemo, useState, memo } from "react";
import type { ExplorerItemProps } from "./ExplorerItem";
import { ExplorerItem } from "./ExplorerItem";
import { getKeyPropFactory } from "ui/tools/getKeyProp";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { assert } from "tsafe/assert";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useArrayDiff } from "powerhooks/useArrayDiff";
import { useTranslation } from "ui/i18n";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useConstCallback } from "powerhooks/useConstCallback";
import { tss } from "ui/theme";
import { Text } from "onyxia-ui/Text";
import { useConst } from "powerhooks/useConst";
import type { Param0 } from "tsafe";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";

export type ExplorerItemsProps = {
    className?: string;

    isNavigating: boolean;

    /** Assert all uniq */
    files: string[];
    /** Assert all uniq */
    directories: string[];

    directoriesBeingCreated: string[];
    filesBeingCreated: string[];

    onNavigate: (params: { basename: string }) => void;
    onOpenFile: (params: { basename: string }) => void;
    onDeleteItem: (params: { kind: "file" | "directory"; basename: string }) => void;
    onCopyPath: (params: { basename: string }) => void;

    /** Assert initial value is none */
    onSelectedItemKindValueChange: (params: {
        selectedItemKind: "file" | "directory" | "none";
    }) => void;

    evtAction: NonPostableEvt<
        "DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH" //TODO: Delete, legacy from secret explorer
    >;
};

export const ExplorerItems = memo((props: ExplorerItemsProps) => {
    const {
        className,
        isNavigating,
        files,
        directories,
        onNavigate,
        onOpenFile,
        onDeleteItem,
        onCopyPath,
        directoriesBeingCreated,
        filesBeingCreated,
        evtAction,
        onSelectedItemKindValueChange
    } = props;

    const { classes, cx } = useStyles({
        "isEmpty": files.length === 0 && directories.length === 0
    });

    const { getKeyProp, getValuesCurrentlyMappedToKeyProp } = useConst(() =>
        getKeyPropFactory<{
            kind: "directory" | "file";
            basename: string;
        }>()
    );

    const [selectedItemKeyProp, setSelectedItemKeyProp] = useState<string | undefined>(
        undefined
    );

    useEffectOnValueChange(
        selectedItemKind => onSelectedItemKindValueChange({ selectedItemKind }),
        [
            useMemo(
                () =>
                    selectedItemKeyProp === undefined
                        ? ("none" as const)
                        : getValuesCurrentlyMappedToKeyProp(selectedItemKeyProp).kind,
                [selectedItemKeyProp, getValuesCurrentlyMappedToKeyProp]
            )
        ]
    );

    useEvt(
        ctx =>
            evtAction.attach(ctx, action => {
                switch (action) {
                    case "DELETE SELECTED ITEM":
                        assert(selectedItemKeyProp !== undefined);
                        onDeleteItem(
                            getValuesCurrentlyMappedToKeyProp(selectedItemKeyProp)
                        );
                        break;
                    case "COPY SELECTED ITEM PATH":
                        assert(selectedItemKeyProp !== undefined);
                        onCopyPath({
                            "basename":
                                getValuesCurrentlyMappedToKeyProp(selectedItemKeyProp)
                                    .basename
                        });
                        break;
                }
            }),
        [
            evtAction,
            onDeleteItem,
            onCopyPath,
            selectedItemKeyProp,
            getValuesCurrentlyMappedToKeyProp
        ]
    );

    useEffectOnValueChange(() => {
        setSelectedItemKeyProp(undefined);
    }, [isNavigating]);

    // If selected item is removed, unselect it.
    {
        const callbackFactory = useCallbackFactory(
            ([kind]: ["file" | "directory"], [params]: [{ removed: string[] }]) => {
                const { removed } = params;

                if (selectedItemKeyProp === undefined) {
                    return;
                }

                const selectedItem =
                    getValuesCurrentlyMappedToKeyProp(selectedItemKeyProp);

                if (
                    selectedItem.kind === kind &&
                    removed.includes(selectedItem.basename)
                ) {
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

    const onMouseEventFactory = useCallbackFactory(
        async (
            [kind, basename]: ["file" | "directory", string],
            [{ type }]: [Param0<ExplorerItemProps["onMouseEvent"]>]
        ) => {
            if (isNavigating) {
                return;
            }

            switch (type) {
                case "down":
                    const keyProp = getKeyProp({ kind, basename });
                    setSelectedItemKeyProp(keyProp);
                    break;

                case "double":
                    switch (kind) {
                        case "directory":
                            onNavigate({ basename });
                            break;
                        case "file":
                            onOpenFile({ basename });
                            break;
                    }
                    break;
            }
        }
    );

    const getIsValidBasenameFactory = useCallbackFactory(
        (
            [kind, basename]: ["file" | "directory", string],

            [{ basename: candidateBasename }]: [
                Parameters<ExplorerItemProps["getIsValidBasename"]>[0]
            ]
        ) => {
            if (basename === candidateBasename) {
                return true;
            }

            if (
                (() => {
                    switch (kind) {
                        case "directory":
                            return directories;
                        case "file":
                            return files;
                    }
                })().includes(candidateBasename)
            ) {
                return false;
            }

            return !candidateBasename.includes(" ") && !candidateBasename.includes("/");
        }
    );

    const containerRef = useStateRef<HTMLDivElement>(null);

    const onGridMouseDown = useConstCallback(
        ({ target }: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            if (
                containerRef.current !== target &&
                !Array.from(containerRef.current!.children).includes(target as any)
            ) {
                return;
            }

            setSelectedItemKeyProp(undefined);
        }
    );

    const { t } = useTranslation({ ExplorerItems });

    return (
        <div
            className={cx(classes.root, className)}
            ref={containerRef}
            onMouseDown={onGridMouseDown}
        >
            {files.length === 0 && directories.length === 0 ? (
                <Text typo="body 1">{t("empty directory")}</Text>
            ) : (
                <>
                    {(["directory", "file"] as const).map(kind =>
                        (() => {
                            switch (kind) {
                                case "directory":
                                    return directories;
                                case "file":
                                    return files;
                            }
                        })().map(basename => {
                            const keyProp = getKeyProp({ kind, basename });
                            const isSelected = selectedItemKeyProp === keyProp;

                            return (
                                <ExplorerItem
                                    className={classes.item}
                                    key={keyProp}
                                    kind={kind}
                                    basename={basename}
                                    isSelected={isSelected}
                                    isCircularProgressShown={(() => {
                                        switch (kind) {
                                            case "directory":
                                                return [...directoriesBeingCreated];
                                            case "file":
                                                return [...filesBeingCreated];
                                        }
                                    })().includes(basename)}
                                    onMouseEvent={onMouseEventFactory(kind, basename)}
                                    getIsValidBasename={getIsValidBasenameFactory(
                                        kind,
                                        basename
                                    )}
                                />
                            );
                        })
                    )}
                </>
            )}
        </div>
    );
});

export const { i18n } = declareComponentKeys<"empty directory">()({ ExplorerItems });

const useStyles = tss
    .withName({ ExplorerItems })
    .withParams<{ isEmpty: boolean }>()
    .create(({ theme, isEmpty }) => ({
        "root": {
            ...(isEmpty
                ? {}
                : {
                      "display": "flex",
                      "flexWrap": "wrap",
                      "justifyContent": "flex-start"
                  })
        },
        "item": {
            "margin": theme.spacing(2)
        }
    }));
