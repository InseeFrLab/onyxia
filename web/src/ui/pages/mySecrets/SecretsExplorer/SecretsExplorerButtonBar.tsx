import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n";
import { useConstCallback } from "powerhooks/useConstCallback";
import { ButtonBar, IconId } from "ui/theme";
import type { ButtonBarProps } from "onyxia-ui/ButtonBar";
import { declareComponentKeys } from "i18nifty";

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
        (): ButtonBarProps<ButtonId, IconId>["buttons"] =>
            buttonIds.map(buttonId => ({
                "buttonId": buttonId,
                "icon": (() => {
                    switch (buttonId) {
                        case "refresh":
                            return "cached" as const;
                        case "copy path":
                            return "filterNone";
                        case "create directory":
                            return "add";
                        case "new":
                            return "add";
                        case "delete":
                            return "delete";
                        case "rename":
                            return "edit";
                    }
                })(),
                "isDisabled": (() => {
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
                "label": buttonId === "new" ? t("create secret") : t(buttonId)
            })),
        [isSelectedItemInEditingState, selectedItemKind, isFileOpen, t]
    );

    return <ButtonBar buttons={buttons} onClick={onClick} />;
});

export const { i18n } = declareComponentKeys<
    | ButtonId
    | "create secret"
    | "upload file"
    | "secret"
    | "file"
    //TODO: Remove
    | { K: "create what"; P: { what: string } }
>()({ SecretsExplorerButtonBar });

const buttonIds = [
    "refresh",
    "rename",
    "new",
    "create directory",
    "delete",
    "copy path"
] as const;

export type ButtonId = (typeof buttonIds)[number];
