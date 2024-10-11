import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { ButtonBarProps } from "onyxia-ui/ButtonBar";
import { declareComponentKeys } from "i18nifty";
import { BaseBar } from "onyxia-ui/BaseBar";
import { ButtonBarButton } from "onyxia-ui/ButtonBarButton";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe";
import { IconButton } from "onyxia-ui/IconButton";
import { useStyles } from "tss";

export type Props = {
    selectedItemKind: "file" | "directory" | "none";
    viewMode: "list" | "block";
    setViewMode: (mode: Props["viewMode"]) => void;
    //TODO: Restore when we have fileViewer usecase
    //isFileOpen: boolean;

    callback: (buttonId: ButtonId) => void;
};

export const ExplorerButtonBar = memo((props: Props) => {
    const { selectedItemKind, callback, setViewMode, viewMode } = props;

    const { t } = useTranslation({ ExplorerButtonBar });
    const { css, theme } = useStyles();
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

    const onClickFactory = useCallbackFactory(([buttonId]: [ButtonId]) =>
        onClick(buttonId)
    );
    //return <ButtonBar buttons={buttons} onClick={onClick} />;

    return (
        <BaseBar>
            <IconButton
                onClick={() => setViewMode("list")}
                className={css(
                    viewMode === "list"
                        ? {
                              "& svg": {
                                  "color": theme.colors.useCases.buttons.actionActive
                              }
                          }
                        : {}
                )}
                icon={id<MuiIconComponentName>("Sort")}
            />
            <IconButton
                onClick={() => setViewMode("block")}
                className={css(
                    viewMode === "block"
                        ? {
                              "& svg": {
                                  "color": theme.colors.useCases.buttons.actionActive
                              }
                          }
                        : {}
                )}
                icon={id<MuiIconComponentName>("ViewCompact")}
            />

            {buttons.map(button => (
                <ButtonBarButton
                    startIcon={button.icon}
                    disabled={button.isDisabled ?? false}
                    {...("link" in button
                        ? {
                              "key": button.link.href,
                              "href": button.link.href,
                              "onClick": button.link.onClick,
                              "doOpenNewTabIfHref": button.link.target === "_blank"
                          }
                        : {
                              "key": button.buttonId,
                              "onClick": onClickFactory(button.buttonId)
                          })}
                >
                    {button.label}
                </ButtonBarButton>
            ))}
        </BaseBar>
    );
});

const { i18n } = declareComponentKeys<
    | ButtonId
    | "upload file"
    | "file"
    //TODO: Remove
    | { K: "create what"; P: { what: string } }
>()({ ExplorerButtonBar });
export type I18n = typeof i18n;

const buttonIds = ["refresh", "new", "create directory", "delete", "copy path"] as const;

export type ButtonId = (typeof buttonIds)[number];
