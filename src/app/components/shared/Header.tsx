import { memo } from "react";
import { IconButton } from "app/theme";
import { Button } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import { useConstCallback } from "powerhooks/useConstCallback";
import { ReactComponent as OnyxiaLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { makeStyles, Text } from "app/theme";
import type { useIsCloudShellVisible } from "js/components/cloud-shell/cloud-shell";
import { useIsDarkModeEnabled, useWindowInnerSize } from "onyxia-ui";
import { ChangeLanguage } from "./ChangeLanguage";

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

const { useStyles } = makeStyles<Props>()((theme, { logoMaxWidth }) => ({
    "root": {
        "backgroundColor": theme.colors.useCases.surfaces.background,
        "overflow": "auto",
        "display": "flex",
    },
    "logoContainer": {
        "cursor": "pointer",
        "width": logoMaxWidth,
        "minWidth": 45,
        "textAlign": "center",
        "display": "flex",
        "alignItems": "center",
        "justifyContent": "center",
    },
    "svg": {
        "fill": theme.colors.palette.focus.main,
        "width": 53,
    },
}));

export const Header = memo((props: Props) => {
    const { className, onLogoClick } = props;

    const { t } = useTranslation("Header");

    const { classes, cx, css, theme } = useStyles(props);

    const { windowInnerWidth } = useWindowInnerSize();

    return (
        <header className={cx(classes.root, className)}>
            <div onClick={onLogoClick} className={classes.logoContainer}>
                <OnyxiaLogoSvg className={classes.svg} />
            </div>
            <div
                onClick={onLogoClick}
                className={css({
                    "display": "flex",
                    "justifyContent": "center",
                    "alignItems": "center",
                    "cursor": "pointer",
                })}
            >
                {props.type === "core" && (
                    <Text
                        typo="section heading"
                        className={css({ "fontWeight": 600 })}
                    >
                        Onyxia -
                    </Text>
                )}
                <Text
                    typo="section heading"
                    className={css({ "margin": theme.spacing(0, 1) })}
                >
                    SSP Cloud
                </Text>
                {windowInnerWidth > 450 && (
                    <Text
                        typo="section heading"
                        className={css({ "fontWeight": 500 })}
                        color="focus"
                    >
                        Datalab
                    </Text>
                )}
            </div>

            <div
                className={css({
                    "flex": 1,
                    "display": "flex",
                    "justifyContent": "flex-end",
                    "alignItems": "center",
                })}
            >
                <ChangeLanguage />
                {props.type === "core" && (
                    <>
                        <ToggleDarkMode />
                        {props.isUserLoggedIn && (
                            <ToggleCloudShell
                                useIsCloudShellVisible={
                                    props.useIsCloudShellVisible
                                }
                            />
                        )}
                        <Button
                            onClick={props.onAuthClick}
                            variant={
                                props.isUserLoggedIn ? "secondary" : "primary"
                            }
                            className={css({ "marginLeft": theme.spacing(2) })}
                        >
                            {t(props.isUserLoggedIn ? "logout" : "login")}
                        </Button>
                    </>
                )}
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
        const { isDarkModeEnabled, setIsDarkModeEnabled } =
            useIsDarkModeEnabled();

        const onClick = useConstCallback(() =>
            setIsDarkModeEnabled(!isDarkModeEnabled),
        );

        return (
            <IconButton
                iconId={isDarkModeEnabled ? "brightness7" : "brightness4"}
                onClick={onClick}
            />
        );
    });

    return { ToggleDarkMode };
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
                "toggleCloudShellVisibility": useConstCallback(() =>
                    setIsCloudShellVisible(value => !value),
                ),
            };
        })();

        return (
            <IconButton
                iconId="bash"
                size="large"
                onClick={toggleCloudShellVisibility}
            />
        );
    });

    return { ToggleCloudShell };
})();
