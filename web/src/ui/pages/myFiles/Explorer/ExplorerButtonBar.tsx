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
import { ViewMode } from "../shared/types";

export type Props = {
    selectedItemKind: "file" | "directory" | "multiple" | "none";
    viewMode: ViewMode;
    onViewModeChange: (params: { viewMode: ViewMode }) => void;
    //TODO: Restore when we have fileViewer usecase
    //isFileOpen: boolean;

    callback: (buttonId: ButtonId) => void;
};

export const ExplorerButtonBar = memo((props: Props) => {
    const { selectedItemKind, callback, onViewModeChange, viewMode } = props;

    const { t } = useTranslation({ ExplorerButtonBar });
    const { css, theme } = useStyles();
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
                            return "cached" as const;
                        case "copy path":
                            return "filterNone";
                        case "create directory":
                            return "add";
                        case "new":
                            return "add";
                        case "delete":
                            return "delete";
                        case "share":
                            return "share";
                    }
                })(),
                isDisabled: (() => {
                    switch (buttonId) {
                        case "refresh":
                            return false;
                        case "new":
                        case "create directory":
                            //return isFileOpen;
                            return false;
                        case "delete":
                        case "share":
                            return selectedItemKind === "none";
                        case "copy path":
                            return selectedItemKind !== "file";
                    }
                })(),
                label: buttonId === "new" ? t("upload file") : t(buttonId)
            })),
        [selectedItemKind, t]
    );

    const onClickFactory = useCallbackFactory(([buttonId]: [ButtonId]) =>
        onClick(buttonId)
    );

    return (
        <BaseBar>
            <IconButton
                onClick={() => onViewModeChange({ viewMode: "list" })}
                className={css(
                    viewMode === "list"
                        ? {
                              "& svg": {
                                  color: theme.colors.useCases.buttons.actionActive
                              }
                          }
                        : {}
                )}
                icon={id<MuiIconComponentName>("Sort")}
                aria-label={t("alt list view")}
            />
            <IconButton
                onClick={() => onViewModeChange({ viewMode: "block" })}
                className={css(
                    viewMode === "block"
                        ? {
                              "& svg": {
                                  color: theme.colors.useCases.buttons.actionActive
                              }
                          }
                        : {}
                )}
                icon={id<MuiIconComponentName>("ViewCompact")}
                aria-label={t("alt block view")}
            />

            {buttons.map(button => (
                <ButtonBarButton
                    startIcon={button.icon}
                    disabled={button.isDisabled ?? false}
                    {...("link" in button
                        ? {
                              key: button.link.href,
                              href: button.link.href,
                              onClick: button.link.onClick,
                              doOpenNewTabIfHref: button.link.target === "_blank"
                          }
                        : {
                              key: button.buttonId,
                              onClick: onClickFactory(button.buttonId)
                          })}
                >
                    {button.label}
                </ButtonBarButton>
            ))}
        </BaseBar>
    );
});

const { i18n } = declareComponentKeys<
    ButtonId | "upload file" | "file" | "alt block view" | "alt list view"
>()({
    ExplorerButtonBar
});
export type I18n = typeof i18n;

const buttonIds = [
    "refresh",
    "new",
    "create directory",
    "delete",
    "copy path",
    "share"
] as const;

export type ButtonId = (typeof buttonIds)[number];
