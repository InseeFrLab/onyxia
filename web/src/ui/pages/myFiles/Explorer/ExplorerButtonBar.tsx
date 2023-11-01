import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n";
import { useConstCallback } from "powerhooks/useConstCallback";
import { ButtonBar } from "onyxia-ui/ButtonBar";
import type { ButtonBarProps } from "onyxia-ui/ButtonBar";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    selectedItemKind: "file" | "directory" | "none";
    //TODO: Restore when we have fileViewer usecase
    //isFileOpen: boolean;

    callback: (buttonId: ButtonId) => void;
};

export const ExplorerButtonBar = memo((props: Props) => {
    const { selectedItemKind, callback } = props;

    const { t } = useTranslation({ ExplorerButtonBar });

    const onClick = useConstCallback<ButtonBarProps<ButtonId>["onClick"]>(buttonId =>
        callback(buttonId)
    );

    const buttons = useMemo(
        (): ButtonBarProps<ButtonId>["buttons"] =>
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
                    }
                })(),
                "isDisabled": (() => {
                    switch (buttonId) {
                        case "refresh":
                            return false;
                        case "new":
                        case "create directory":
                            //return isFileOpen;
                            return false;
                        case "delete":
                            //return selectedItemKind === "none" || isFileOpen;
                            return selectedItemKind === "none";
                        case "copy path":
                            //return selectedItemKind === "none" || isFileOpen;
                            return selectedItemKind !== "file";
                    }
                })(),
                "label": buttonId === "new" ? t("upload file") : t(buttonId)
            })),
        [selectedItemKind, t]
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
>()({ ExplorerButtonBar });

const buttonIds = ["refresh", "new", "create directory", "delete", "copy path"] as const;

export type ButtonId = (typeof buttonIds)[number];
