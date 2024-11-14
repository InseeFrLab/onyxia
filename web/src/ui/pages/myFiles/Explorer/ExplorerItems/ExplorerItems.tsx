import { useState, memo } from "react";
import { ExplorerItem } from "./ExplorerItem";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useTranslation } from "ui/i18n";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { assert, type Equals } from "tsafe/assert";
import { declareComponentKeys } from "i18nifty";
import type { Item } from "../../shared/types";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";

export type ExplorerItemsProps = {
    className?: string;

    isNavigating: boolean;

    items: Item[];

    onNavigate: (params: { basename: string }) => void;
    onOpenFile: (params: { basename: string }) => void;
    /** Assert initial value is none */
    onSelectedItemKindValueChange: (params: {
        selectedItemKind: "file" | "directory" | "multiple" | "none";
    }) => void;

    onPolicyChange: (params: {
        basename: string;
        policy: Item["policy"];
        kind: Item["kind"];
    }) => void;
    onDeleteItem: (params: { item: Item }) => void;
    onCopyPath: (params: { basename: string }) => void;
    onShare: (params: { basename: string }) => void;
    evtAction: NonPostableEvt<
        "DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH" | "SHARE"
    >;
};

export const ExplorerItems = memo((props: ExplorerItemsProps) => {
    const {
        className,
        items,
        isNavigating,
        onNavigate,
        onOpenFile,
        onSelectedItemKindValueChange,
        evtAction,
        onPolicyChange,
        onCopyPath,
        onDeleteItem,
        onShare
    } = props;
    const isEmpty = items.length === 0;

    const [selectedItem, setSelectedItem] = useState<
        Item | { basename: undefined; kind: "none" }
    >({ basename: undefined, kind: "none" });

    const { classes, cx } = useStyles({
        isEmpty: isEmpty
    });

    const { t } = useTranslation({ ExplorerItems });

    const handleItemClick = useCallbackFactory(([item]: [Item]) => {
        if (!selectedItem || selectedItem.kind !== item.kind) {
            onSelectedItemKindValueChange({
                selectedItemKind: item.kind
            });
        }
        setSelectedItem(item);
    });

    const handlePolicyChange = useCallbackFactory(([item]: [Item]) => {
        switch (item.policy) {
            case "public":
                onPolicyChange({
                    basename: item.basename,
                    policy: "private",
                    kind: item.kind
                });
                break;
            case "private":
                onPolicyChange({
                    basename: item.basename,
                    policy: "public",
                    kind: item.kind
                });
                break;
        }
    });

    const handleItemDoubleClick = useCallbackFactory(([item]: [Item]) => {
        switch (item.kind) {
            case "directory":
                onNavigate({ basename: item.basename });
                break;
            case "file":
                onOpenFile({ basename: item.basename });
                break;
        }
    });

    useEvt(
        ctx =>
            evtAction.attach(ctx, action => {
                switch (action) {
                    case "DELETE SELECTED ITEM":
                        assert(selectedItem.kind !== "none");
                        onDeleteItem({ item: selectedItem });
                        return;
                    case "COPY SELECTED ITEM PATH":
                        assert(selectedItem.kind !== "none");
                        onCopyPath({
                            basename: selectedItem.basename
                        });
                        return;
                    case "SHARE":
                        assert(selectedItem.kind === "file");
                        onShare({
                            basename: selectedItem.basename
                        });
                        return;
                }
                assert<Equals<typeof action, never>>();
            }),
        [evtAction, onDeleteItem, onCopyPath, selectedItem]
    );

    useEffectOnValueChange(() => {
        setSelectedItem({ basename: undefined, kind: "none" });
    }, [isNavigating]);

    return (
        <div className={cx(classes.root, className)} role="listbox">
            {isEmpty ? (
                <Text typo="body 1">{t("empty directory")}</Text>
            ) : (
                <>
                    {items.map(item => {
                        const {
                            basename,
                            kind,
                            policy,
                            isBeingDeleted,
                            isBeingCreated,
                            isPolicyChanging
                        } = item;
                        const size = "size" in item ? item.size : undefined;
                        return (
                            <ExplorerItem
                                className={classes.item}
                                key={`${basename}-${kind}`}
                                kind={kind}
                                basename={basename}
                                isSelected={selectedItem.basename === basename}
                                size={size}
                                policy={policy}
                                onPolicyChange={handlePolicyChange(item)}
                                onClick={handleItemClick(item)}
                                onDoubleClick={handleItemDoubleClick(item)}
                                isCircularProgressShown={isBeingDeleted || isBeingCreated}
                                isPolicyChanging={isPolicyChanging}
                            />
                        );
                    })}
                </>
            )}
        </div>
    );
});

const { i18n } = declareComponentKeys<"empty directory">()({ ExplorerItems });
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ ExplorerItems })
    .withParams<{ isEmpty: boolean }>()
    .create(({ theme, isEmpty }) => ({
        root: {
            ...(isEmpty
                ? {}
                : {
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "flex-start"
                  })
        },
        item: {
            width: theme.spacing(9),
            height: theme.spacing(9),
            margin: theme.spacing(2)
        }
    }));
