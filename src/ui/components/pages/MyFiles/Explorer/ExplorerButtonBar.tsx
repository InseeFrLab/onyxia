import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n";
import { useConstCallback } from "powerhooks/useConstCallback";
import { ButtonBar, IconId } from "ui/theme";
import type { ButtonBarProps } from "onyxia-ui/ButtonBar";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    selectedItemKind: "file" | "directory" | "none";
    directoryBrowsingHasFailed: boolean;
    //TODO: Restore when we have fileViewer usecase

    callback: (buttonId: ButtonId) => void;
};

export const ExplorerButtonBar = memo((props: Props) => {
    const { selectedItemKind, directoryBrowsingHasFailed, callback } = props;

    const { t } = useTranslation({ ExplorerButtonBar });

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
                    }
                })(),
                "isDisabled": (() => {
                    switch (buttonId) {
                        case "refresh":
                            return false;
                        case "new":
                            return directoryBrowsingHasFailed;
                        case "create directory":
                            return directoryBrowsingHasFailed;
                        case "delete":
                            return (
                                directoryBrowsingHasFailed || selectedItemKind === "none"
                            );
                        case "copy path":
                            return (
                                directoryBrowsingHasFailed || selectedItemKind !== "file"
                            );
                    }
                })(),
                "label": buttonId === "new" ? t("upload file") : t(buttonId)
            })),
        [selectedItemKind, directoryBrowsingHasFailed, t]
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

export type ButtonId = typeof buttonIds[number];
