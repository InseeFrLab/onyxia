
import { useState, memo } from "react";
import { IconButton } from "app/components/designSystem/IconButton";
import { Button } from "app/components/designSystem/Button";
import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "powerhooks";
import { useConstCallback } from "powerhooks";
import { ReactComponent as OnyxiaLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { createUseClassNames } from "app/theme/useClassNames";
import { useTheme } from "@material-ui/core/styles";
import { cx, css } from "tss-react";
import { useDomRect } from "powerhooks";
import { Typography } from "app/components/designSystem/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import MuiButton from "@material-ui/core/Button";
import type { ButtonProps as MuiButtonProps } from "@material-ui/core/Button";
import { Icon } from "app/components/designSystem/Icon";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import type { SupportedLanguage } from "app/i18n/resources";
import { useLng } from "app/i18n/useLng";
import { objectKeys } from "evt/tools/typeSafety/objectKeys";
import type { useIsCloudShellVisible } from "js/components/cloud-shell/cloud-shell";
import { useIsDarkModeEnabled } from "app/theme/useIsDarkModeEnabled";

export type Props = Props.Core | Props.Keycloak;

export declare namespace Props {

    export type Common = {
        className?: string;
        logoMaxWidth: number;
        onLogoClick(): void;
    };

    export type Keycloak = Common & {
        type: "keycloak";
    };

    export type Core = Common & {
        type: "core";
        isUserLoggedIn: boolean;
        useIsCloudShellVisible: typeof useIsCloudShellVisible;
        onAuthClick(): void;
    };

}

const { useClassNames } = createUseClassNames<Props>()(
    (theme, { logoMaxWidth }) => ({
        "root": {
            "backgroundColor": theme.custom.colors.useCases.surfaces.background,
            "overflow": "auto",
            "display": "flex"
        },
        "logoContainer": {
            "cursor": "pointer",
            "width": logoMaxWidth,
            "textAlign": "center",
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center"
        },
        "svg": {
            "fill": theme.custom.colors.palette.exuberantOrange.main,
            "width": 53,
        }
    })
);

export const Header = memo((props: Props) => {

    const { className, onLogoClick } = props;

    const { t } = useTranslation("Header");

    const { classNames } = useClassNames(props );

    const theme = useTheme();

    return (
        <header className={cx(classNames.root, className)}>
            <div
                onClick={onLogoClick}
                className={classNames.logoContainer}
            >
                <OnyxiaLogoSvg className={classNames.svg} />
            </div>
            <div
                onClick={onLogoClick}
                className={css({
                    "display": "flex",
                    "justifyContent": "center",
                    "alignItems": "center",
                    "cursor": "pointer"
                })}>
                {props.type === "core" &&
                    <Typography
                        variant="h4"
                        className={css({ "fontWeight": 600 })}
                    >
                        Onyxia -
                    </Typography>
                }
                <Typography
                    variant="h4"
                    className={css({ "margin": theme.spacing(0, 1) })}
                >
                    SSP Cloud
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
                <ToggleDarkMode />
                {props.type === "core" &&
                    <>
                        {props.isUserLoggedIn && <ToggleCloudShell useIsCloudShellVisible={props.useIsCloudShellVisible} />}
                        <Button
                            onClick={props.onAuthClick}
                            color={props.isUserLoggedIn ? "secondary" : "primary"}
                            className={css({ "marginLeft": theme.spacing(2) })}
                        >
                            {t(props.isUserLoggedIn ? "logout" : "login")}
                        </Button>
                    </>
                }
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


    const ToggleDarkMode = memo(() => {

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

    const { useClassNames } = createUseClassNames<{ buttonWidth: number; }>()(
        (theme, { buttonWidth }) => ({
            "menu": {
                "& .Mui-selected": {
                    "backgroundColor": theme.custom.colors.useCases.surfaces.surfaces
                },
                "& .MuiPaper-root": {
                    "backgroundColor": theme.custom.colors.useCases.surfaces.background,
                    "width": buttonWidth
                },
                "& a": {
                    "color": theme.custom.colors.useCases.typography.textPrimary
                }
            }
        })
    );

    const ChangeLanguage = memo(() => {

        const { lng, setLng } = useLng();

        const { ref: buttonRef, domRect: { width: buttonWidth } } = useDomRect();

        const { classNames } = useClassNames({ buttonWidth });

        const [languageMenu, setLanguageMenu] = useState<HTMLButtonElement | undefined>(undefined);

        const handleLanguageIconClick = useConstCallback(
            (event: Parameters<NonNullable<MuiButtonProps["onClick"]>>[0]) =>
                setLanguageMenu(event.currentTarget)
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

const { ToggleCloudShell } = (() => {

    type Props = {
        useIsCloudShellVisible: typeof useIsCloudShellVisible;
    };

    const ToggleCloudShell = memo((props: Props) => {

        const { useIsCloudShellVisible } = props;

        const { toggleCloudShellVisibility } = (function useClosure() {

            const { setIsCloudShellVisible } = useIsCloudShellVisible();

            return {
                "toggleCloudShellVisibility":
                    useConstCallback(() => setIsCloudShellVisible(value => !value))
            };

        })();

        return (
            <IconButton
                type="bash"
                fontSize="large"
                onClick={toggleCloudShellVisibility}
            />
        );

    });

    return { ToggleCloudShell };

})();


