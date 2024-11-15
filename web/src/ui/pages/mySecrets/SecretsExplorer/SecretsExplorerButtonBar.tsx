import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n";
import { useConstCallback } from "powerhooks/useConstCallback";
import { ButtonBar, type ButtonBarProps } from "onyxia-ui/ButtonBar";
import { declareComponentKeys } from "i18nifty";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    selectedItemKind: "file" | "directory" | "none";
    isSelectedItemInEditingState: boolean;
    isFileOpen: boolean;

    callback: (buttonId: ButtonId) => void;
};

export const SecretsExplorerButtonBar = memo((props: Props) => {
    const { selectedItemKind, isSelectedItemInEditingState, isFileOpen, callback } =
        props;

    const { t } = useTranslation({ SecretsExplorerButtonBar });

    const onClick = useConstCallback<ButtonBarProps<ButtonId>["onClick"]>(buttonId =>
        callback(buttonId)
    );

    const buttons = useMemo(
        (): ButtonBarProps<ButtonId>["buttons"] =>
            buttonIds.map(buttonId => ({
                buttonId: buttonId,
                icon: (() => {
                    switch (buttonId) {
                        case "refresh":
                            return getIconUrlByName("Cached");
                        case "copy path":
                            return getIconUrlByName("FilterNone");
                        case "create directory":
                            return getIconUrlByName("Add");
                        case "new":
                            return getIconUrlByName("Add");
                        case "delete":
                            return getIconUrlByName("Delete");
                        case "rename":
                            return getIconUrlByName("Edit");
                    }
                })(),
                isDisabled: (() => {
                    switch (buttonId) {
                        case "refresh":
                            return false;
                        case "rename":
                            return (
                                isSelectedItemInEditingState ||
                                selectedItemKind === "none" ||
                                isFileOpen
                            );
                        case "new":
                        case "create directory":
                            return isFileOpen;
                        case "delete":
                            return selectedItemKind === "none" || isFileOpen;
                        case "copy path":
                            return selectedItemKind !== "file" && !isFileOpen;
                    }
                })(),
                label: buttonId === "new" ? t("create secret") : t(buttonId)
            })),
        [isSelectedItemInEditingState, selectedItemKind, isFileOpen, t]
    );

    return <ButtonBar buttons={buttons} onClick={onClick} />;
});

const { i18n } = declareComponentKeys<
    | ButtonId
    | "create secret"
    | "secret"
    //TODO: Remove
    | { K: "create what"; P: { what: string } }
>()({ SecretsExplorerButtonBar });
export type I18n = typeof i18n;

const buttonIds = [
    "refresh",
    "rename",
    "new",
    "create directory",
    "delete",
    "copy path"
] as const;

export type ButtonId = (typeof buttonIds)[number];
