

import { useState, memo } from "react";
import { useCallbackFactory } from "powerhooks";
import { useConstCallback } from "powerhooks";
import { createUseClassNames, useTheme } from "app/theme";
import { css } from "tss-react";
import { useDomRect } from "onyxia-ui";
import { Typography } from "onyxia-ui";
import { Tooltip } from "onyxia-ui";
import MuiButton from "@material-ui/core/Button";
import type { ButtonProps as MuiButtonProps } from "@material-ui/core/Button";
import { Icon } from "onyxia-ui";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import type { SupportedLanguage } from "app/i18n/resources";
import { useLng } from "app/i18n/useLng";
import { objectKeys } from "tsafe/objectKeys";

const menuId = "language-menu";

type Props= {
    doShowIcon?: boolean;
};

const lngPrettyPrintByLng: Record<SupportedLanguage, string> = {
    "en": "English",
    "fr": "French"
};

const { useClassNames } = createUseClassNames<{ buttonWidth: number; }>()(
    (theme, { buttonWidth }) => ({
        "menu": {
            "& .Mui-selected": {
                "backgroundColor": theme.colors.useCases.surfaces.surface1
            },
            "& .MuiPaper-root": {
                "backgroundColor": theme.colors.useCases.surfaces.background,
                "width": buttonWidth
            },
            "& a": {
                "color": theme.colors.useCases.typography.textPrimary
            }
        }
    })
);

export const ChangeLanguage = memo((props: Props) => {

    const { doShowIcon = true } = props;

    const { lng, setLng } = useLng();

    const { ref: buttonRef, domRect: { width: buttonWidth } } = useDomRect();

    const { classNames } = useClassNames({ buttonWidth });

    const [languageMenu, setLanguageMenu] = useState<HTMLButtonElement | undefined>(undefined);

    const handleLanguageIconClick = useConstCallback<MuiButtonProps["onClick"]>(
        event => setLanguageMenu(event.currentTarget)
    );

    const onMenuClose = useConstCallback(
        () => setLanguageMenu(undefined)
    );

    const onMenuItemClickFactory = useCallbackFactory(
        ([lng]: [SupportedLanguage]) => {
            setLng(lng);
            onMenuClose();
        }
    );

    const theme = useTheme();

    return (
        <>
            <Tooltip title={"change language"} enterDelay={300}>
                <MuiButton
                    ref={buttonRef}
                    aria-owns={languageMenu ? menuId : undefined}
                    aria-haspopup="true"
                    aria-label={"change language"}
                    onClick={handleLanguageIconClick}
                    data-ga-event-category="header"
                    data-ga-event-action="language"
                >
                    {doShowIcon && <Icon type="translate" />}
                    <Typography
                        variant="subtitle1"
                        className={css({ "marginLeft": theme.spacing(1) })}
                    >
                        {lngPrettyPrintByLng[lng].toUpperCase()}
                    </Typography>
                    <Icon type="expandMore" />
                </MuiButton>
            </Tooltip>
            <Menu
                id={menuId}
                anchorEl={languageMenu}
                open={languageMenu !== undefined}
                className={classNames.menu}
                onClose={onMenuClose}
            >
                {
                    objectKeys(lngPrettyPrintByLng)
                        .sort((a, b) => a === lng ? -1 : b === lng ? 1 : 0)
                        .map(supportedLanguage => (
                            <MenuItem
                                component="a"
                                data-no-link="true"
                                key={supportedLanguage}
                                selected={lng === supportedLanguage}
                                onClick={onMenuItemClickFactory(supportedLanguage)}
                                lang={supportedLanguage}
                            >
                                {lngPrettyPrintByLng[supportedLanguage]}
                            </MenuItem>
                        ))}
            </Menu>
        </>
    );

});




