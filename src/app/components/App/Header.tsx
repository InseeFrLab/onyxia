
import { useState, memo } from "react";
import { IconButton } from "app/components/designSystem/IconButton";
import { Button } from "app/components/designSystem/Button";
import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "app/tools/hooks/useCallbackFactory";
import { ReactComponent as HeaderLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { createUseClassNames, cx, css, useTheme } from "app/theme/useClassNames";
import { useDOMRect } from "app/tools/hooks/useDOMRect";
import { Typography } from "app/components/designSystem/Typography";
import type { useIsDarkModeEnabled } from "app/tools/hooks/useIsDarkModeEnabled";
import { useConstCallback } from "app/tools/hooks/useConstCallback";
import Tooltip from "@material-ui/core/Tooltip";
import MuiButton from "@material-ui/core/Button";
import type { ButtonProps as MuiButtonProps } from "@material-ui/core/Button";
import { Icon } from "app/components/designSystem/Icon";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import type { SupportedLanguage } from "app/i18n/resources";
import { useLng } from "app/i18n/useLng";
import { objectKeys } from "evt/tools/typeSafety/objectKeys";

type Target = "logo" | "cloudShell" | "auth button";

export type Props = {
    className?: string;
    isUserLoggedIn: boolean;
    logoMaxWidth: number;
    onClick(target: Target): void;
    useIsDarkModeEnabled: typeof useIsDarkModeEnabled;
};

const logoWidth = 53;

const { useClassNames } = createUseClassNames<Props>()(
    ({ theme }, { logoMaxWidth }) => ({
        "root": {
            "backgroundColor": theme.custom.colors.useCases.surfaces.background,
            "overflow": "auto",
            "display": "flex"
        },
        "logoContainer": {
            "cursor": "pointer",
            "width": Math.max(logoMaxWidth, logoWidth),
            "textAlign": "center"
        }
    })
);

export const Header = memo((props: Props) => {

    const { isUserLoggedIn, onClick, useIsDarkModeEnabled, className = undefined } = props;


    const { t } = useTranslation("Header");

    const onClickFactory = useCallbackFactory(
        ([target]: [Target]) => onClick(target)
    );

    const { domRect: { height }, ref } = useDOMRect();

    const { classNames } = useClassNames(props);

    const theme = useTheme();

    return (
        <header className={cx(classNames.root, className)} ref={ref}>
            <div
                onClick={onClickFactory("logo")}
                className={classNames.logoContainer}
            >
                <HeaderLogoSvg
                    width={logoWidth}
                    height={height}
                />
            </div>
            <div
                onClick={onClickFactory("logo")}
                className={css({
                    "display": "flex",
                    "justifyContent": "center",
                    "alignItems": "center",
                    "cursor": "pointer"
                })}>

                <Typography
                    variant="h4"
                    className={css({ "fontWeight": 600 })}
                >
                    Onyxia
                </Typography>
                <Typography
                    variant="h4"
                    className={css({ "margin": theme.spacing(0, 1) })}
                >
                    - SSP Cloud
                </Typography>
                <Typography
                    variant="h4"
                    className={css({ "fontWeight": 500 })}
                    color="focus"
                >
                    Datalab
                </Typography>

            </div>

            <div className={css({
                "flex": 1,
                "display": "flex",
                "justifyContent": "flex-end",
                "alignItems": "center",
            })}>
                <ChangeLanguage />
                <ToggleDarkMode useIsDarkModeEnabled={useIsDarkModeEnabled} />
                <IconButton
                    type="bash"
                    fontSize="large"
                    onClick={onClickFactory("cloudShell")}
                />
                <Button
                    onClick={onClickFactory("auth button")}
                    color={isUserLoggedIn ? "secondary" : "primary"}
                    className={css({ "marginLeft": theme.spacing(2) })}
                >
                    {t(isUserLoggedIn ? "logout" : "login")}
                </Button>
            </div>


        </header>
    );

});

export declare namespace Header {
    export type I18nScheme = {
        logout: undefined;
        login: undefined;
    };
}

const { ToggleDarkMode } = (() => {

    type Props = {
        useIsDarkModeEnabled: typeof useIsDarkModeEnabled;
    };

    const ToggleDarkMode = memo((props: Props) => {

        const { useIsDarkModeEnabled } = props;

        const { isDarkModeEnabled, setIsDarkModeEnabled } = useIsDarkModeEnabled();

        const onClick = useConstCallback(() => setIsDarkModeEnabled(!isDarkModeEnabled));

        return (
            <IconButton
                type={isDarkModeEnabled ? "brightness7" : "brightness4"}
                onClick={onClick}
            />
        );


    });

    return { ToggleDarkMode };

})();

const { ChangeLanguage } = (() => {

    const menuId = "language-menu";

    const lngPrettyPrintByLng: Record<SupportedLanguage, string> = {
        "en": "English",
        "fr": "French"
    };

    const { useClassNames } = createUseClassNames<{ buttonWidth: number; }>()(
        ({ theme },{ buttonWidth }) => ({
            "menu": {
                "& .MuiPaper-root":{
                    "width": buttonWidth
                },
                "& .MuiList-root": {
                    "backgroundColor": theme.custom.colors.useCases.surfaces.background
                }
            }
        })
    );

    const ChangeLanguage = memo(() => {

        const { lng, setLng } = useLng();

        const { ref: buttonRef, domRect:{ width: buttonWidth }} = useDOMRect();

        const { classNames } = useClassNames({ buttonWidth });

        const [languageMenu, setLanguageMenu] = useState<HTMLButtonElement | undefined>(undefined);

        const handleLanguageIconClick = useConstCallback(
            (event: Parameters<NonNullable<MuiButtonProps["onClick"]>>[0]) =>
                setLanguageMenu(event.currentTarget)
        );

        const onMenuClose= useConstCallback(
            ()=> setLanguageMenu(undefined)
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
                        <Icon type="translate" />
                        {/* TODO: See todo in icon button */}
                        <Typography 
                        variant="subtitle1" 
                        className={css({ "paddingTop": 3, "marginLeft": theme.spacing(1) })}
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

    return { ChangeLanguage };


})();


