import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n";
import { useConstCallback } from "powerhooks/useConstCallback";
import { ButtonBar, IconId } from "ui/theme";
import type { ButtonBarProps } from "onyxia-ui/ButtonBar";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    explorerType: "s3" | "secrets";

    selectedItemKind: "file" | "directory" | "none";
    isSelectedItemInEditingState: boolean;
    isFileOpen: boolean;

    callback: (buttonId: ButtonId) => void;
};

export const ExplorerButtonBar = memo((props: Props) => {
    const {
        explorerType,
        selectedItemKind,
        isSelectedItemInEditingState,
        isFileOpen,
        callback,
    } = props;

    const { t } = useTranslation({ ExplorerButtonBar });

    const onClick = useConstCallback<ButtonBarProps<ButtonId>["onClick"]>(buttonId =>
        callback(buttonId),
    );

    const buttons = useMemo(
        (): ButtonBarProps<ButtonId, IconId>["buttons"] =>
            buttonIds
                // eslint-disable-next-line array-callback-return
                .filter(buttonId => {
                    switch (explorerType) {
                        case "s3":
                            switch (buttonId) {
                                case "rename":
                                    return false;
                                default:
                                    return true;
                            }
                        case "secrets":
                            return true;
                    }
                })
                .map(buttonId => ({
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
                    "label":
                        buttonId === "new"
                            ? t(
                                  (() => {
                                      switch (explorerType) {
                                          case "s3":
                                              return "upload file";
                                          case "secrets":
                                              return "create secret";
                                      }
                                  })(),
                              )
                            : t(buttonId),
                })),
        [isSelectedItemInEditingState, selectedItemKind, isFileOpen, explorerType, t],
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
    | ["create what", { what: string }]
>()({ ExplorerButtonBar });

const buttonIds = [
    "refresh",
    "rename",
    "new",
    "create directory",
    "delete",
    "copy path",
] as const;

export type ButtonId = typeof buttonIds[number];
