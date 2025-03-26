import { useState, memo } from "react";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useConstCallback } from "powerhooks/useConstCallback";
import MuiButton from "@mui/material/Button";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useTranslation } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";
import { symToStr } from "tsafe/symToStr";
import { getIconUrlByName } from "lazy-icons";

const actions = ["move up", "edit", "copy link", "delete", "move down"] as const;

export type RestorableConfigAction = (typeof actions)[number];

export type Props = {
    callback: (action: RestorableConfigAction) => void;
    doDisableMoveUp: boolean;
    doDisableMoveDown: boolean;
};

export const MyServicesRestorableConfigOptions = memo((props: Props) => {
    const { callback, doDisableMoveUp, doDisableMoveDown } = props;

    const { classes } = useStyles();

    const [menuElement, setMenuElement] = useState<HTMLButtonElement | undefined>(
        undefined
    );

    const onOpenMenuClick = useConstCallback<MuiButtonProps["onClick"]>(event =>
        setMenuElement(event.currentTarget)
    );

    const onMenuClose = useConstCallback(() => setMenuElement(undefined));

    const onMenuItemClickFactory = useCallbackFactory(
        ([action]: [RestorableConfigAction]) => {
            callback(action);
            onMenuClose();
        }
    );

    const { t } = useTranslation({ MyServicesRestorableConfigOptions });

    return (
        <>
            <MuiButton
                className={classes.button}
                aria-owns={menuElement ? menuId : undefined}
                aria-haspopup="true"
                onClick={onOpenMenuClick}
                data-ga-event-category="header"
                data-ga-event-action="language"
            >
                <Icon icon={getIconUrlByName("MoreVert")} className={classes.icon} />
            </MuiButton>
            <Menu
                id={menuId}
                anchorEl={menuElement}
                open={menuElement !== undefined}
                className={classes.menu}
                onClose={onMenuClose}
            >
                {actions
                    .filter(action => {
                        if (doDisableMoveDown && action === "move down") {
                            return false;
                        }

                        if (doDisableMoveUp && action === "move up") {
                            return false;
                        }

                        return true;
                    })
                    .map(action => (
                        <MenuItem
                            component="a"
                            data-no-link="true"
                            key={action}
                            selected={false}
                            onClick={onMenuItemClickFactory(action)}
                        >
                            <Text typo="body 1" className={classes.menuTypo}>
                                <Icon
                                    icon={(() => {
                                        switch (action) {
                                            case "edit":
                                                return getIconUrlByName("Edit");
                                            case "copy link":
                                                return getIconUrlByName("Link");
                                            case "delete":
                                                return getIconUrlByName("Delete");
                                            case "move down":
                                                return getIconUrlByName("ArrowDownward");
                                            case "move up":
                                                return getIconUrlByName("ArrowUpward");
                                        }
                                    })()}
                                />
                                &nbsp;
                                {t(
                                    (() => {
                                        switch (action) {
                                            case "edit":
                                                return "edit" as const;
                                            case "copy link":
                                                return "copy link" as const;
                                            case "delete":
                                                return "remove bookmark" as const;
                                            case "move down":
                                                return "move down" as const;
                                            case "move up":
                                                return "move up" as const;
                                        }
                                    })()
                                )}
                            </Text>
                        </MenuItem>
                    ))}
            </Menu>
        </>
    );
});

MyServicesRestorableConfigOptions.displayName = symToStr({
    MyServicesRestorableConfigOptions
});

const { i18n } = declareComponentKeys<
    "edit" | "remove bookmark" | "copy link" | "move up" | "move down"
>()({
    MyServicesRestorableConfigOptions
});
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ MyServicesRestorableConfigOptions })
    .create(({ theme }) => ({
        icon: {
            color: theme.colors.useCases.typography.textPrimary
        },
        menu: {
            "& .Mui-selected": {
                backgroundColor: theme.colors.useCases.surfaces.surface1
            },
            "& .MuiPaper-root": {
                backgroundColor: theme.colors.useCases.surfaces.background
            },
            "& a": {
                color: theme.colors.useCases.typography.textPrimary
            }
        },
        menuTypo: {
            display: "flex",
            alignItems: "center"
        },
        button: {
            minWidth: "unset",
            marginLeft: theme.spacing(1)
        }
    }));

const menuId = "saved-configurations";
