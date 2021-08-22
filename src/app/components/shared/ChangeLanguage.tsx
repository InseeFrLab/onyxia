import { useState, memo } from "react";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useConstCallback } from "powerhooks/useConstCallback";
import { makeStyles, Icon, Text } from "app/theme";
import { useDomRect } from "onyxia-ui";
import { Tooltip } from "onyxia-ui/Tooltip";
import MuiButton from "@material-ui/core/Button";
import type { ButtonProps as MuiButtonProps } from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import type { SupportedLanguage } from "app/i18n/resources";
import { useLng } from "app/i18n/useLng";
import { objectKeys } from "tsafe/objectKeys";
import { useTranslation } from "app/i18n/useTranslations";

const menuId = "language-menu";

type Props = {
    doShowIcon?: boolean;
};

const lngPrettyPrintByLng: Record<SupportedLanguage, string> = {
    "en": "English",
    /* spell-checker: disable */
    "fr": "Français",
    /* spell-checker: enable */
};

const useStyles = makeStyles<{ buttonWidth: number }>()((theme, { buttonWidth }) => ({
    "menu": {
        "& .Mui-selected": {
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
        },
        "& .MuiPaper-root": {
            "backgroundColor": theme.colors.useCases.surfaces.background,
            "width": buttonWidth,
        },
        "& a": {
            "color": theme.colors.useCases.typography.textPrimary,
        },
    },
    "icon": {
        "color": theme.colors.useCases.typography.textPrimary,
    },
}));

export const ChangeLanguage = memo((props: Props) => {
    const { doShowIcon = true } = props;

    const { lng, setLng } = useLng();

    const {
        ref: buttonRef,
        domRect: { width: buttonWidth },
    } = useDomRect();

    const { classes, theme, css } = useStyles({ buttonWidth });

    const [languageMenu, setLanguageMenu] = useState<HTMLButtonElement | undefined>(
        undefined,
    );

    const handleLanguageIconClick = useConstCallback<MuiButtonProps["onClick"]>(event =>
        setLanguageMenu(event.currentTarget),
    );

    const onMenuClose = useConstCallback(() => setLanguageMenu(undefined));

    const onMenuItemClickFactory = useCallbackFactory(([lng]: [SupportedLanguage]) => {
        setLng(lng);
        onMenuClose();
    });

    const { t } = useTranslation("ChangeLanguage");

    return (
        <>
            <Tooltip title={t("change language")} enterDelay={300}>
                <MuiButton
                    ref={buttonRef}
                    aria-owns={languageMenu ? menuId : undefined}
                    aria-haspopup="true"
                    aria-label={t("change language")}
                    onClick={handleLanguageIconClick}
                    data-ga-event-category="header"
                    data-ga-event-action="language"
                >
                    {doShowIcon && <Icon iconId="public" className={classes.icon} />}
                    <Text
                        typo="label 1"
                        className={css({
                            "marginLeft": theme.spacing(2),
                            "textTransform": "capitalize",
                        })}
                    >
                        {lngPrettyPrintByLng[lng]}
                    </Text>
                    <Icon className={classes.icon} iconId="expandMore" />
                </MuiButton>
            </Tooltip>
            <Menu
                id={menuId}
                anchorEl={languageMenu}
                open={languageMenu !== undefined}
                className={classes.menu}
                onClose={onMenuClose}
            >
                {objectKeys(lngPrettyPrintByLng)
                    .sort((a, b) => (a === lng ? -1 : b === lng ? 1 : 0))
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

export declare namespace ChangeLanguage {
    export type I18nScheme = {
        "change language": undefined;
    };
}
