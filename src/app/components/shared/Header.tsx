import { memo } from "react";
import { IconButton, Button, ButtonBarButton } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import { useConstCallback } from "powerhooks/useConstCallback";
import { makeStyles, Text } from "app/theme";
import type { useIsCloudShellVisible } from "js/components/cloud-shell/cloud-shell";
import { ReactComponent as OnyxiaLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { title } from "paletteIdAndTitle";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useThunks, useSelector } from "app/libApi";
import { kcContext } from "app/components/KcApp/kcContext";

export type Props = Props.Core | Props.Keycloak;

export declare namespace Props {
    export type Common = {
        className?: string;
        logoContainerWidth: number;
        onLogoClick(): void;
    };

    export type Keycloak = Common & {
        useCase: "keycloak";
    };

    export type Core = Common & {
        useCase: "core app";
        isUserLoggedIn: boolean;
        useIsCloudShellVisible: typeof useIsCloudShellVisible;
        onAuthClick(): void;
    };
}

const useStyles = makeStyles<{ logoContainerWidth: number }>()(
    (theme, { logoContainerWidth }) => ({
        "root": {
            "backgroundColor": theme.colors.useCases.surfaces.background,
            "overflow": "auto",
            "display": "flex",
            ...theme.spacing.topBottom("padding", 2),
        },
        "logoContainer": {
            "cursor": "pointer",
            "width": logoContainerWidth,
            "textAlign": "center",
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center",
        },
        "mainTextContainer": {
            "display": "flex",
            "justifyContent": "center",
            "alignItems": "center",
            "cursor": "pointer",
        },
        "svg": {
            "fill": theme.colors.useCases.typography.textFocus,
            "width": "70%",
        },
        "button": {
            "marginBottom": theme.spacing(1),
        },
        "rightEndActionsContainer": {
            "flex": 1,
            "display": "flex",
            "justifyContent": "flex-end",
            "alignItems": "center",
        },
        "projectSelect": {
            "marginLeft": theme.spacing(2),
        },
    }),
);

export const Header = memo((props: Props) => {
    const { className, logoContainerWidth, onLogoClick } = props;

    const { t } = useTranslation("Header");

    const { classes, cx, css, theme } = useStyles({ logoContainerWidth });

    return (
        <header className={cx(classes.root, className)}>
            <div onClick={onLogoClick} className={classes.logoContainer}>
                <OnyxiaLogoSvg className={classes.svg} />
            </div>
            <div onClick={onLogoClick} className={classes.mainTextContainer}>
                {props.useCase === "core app" && (
                    <Text typo="section heading" className={css({ "fontWeight": 600 })}>
                        Onyxia -
                    </Text>
                )}
                {title && (
                    <Text
                        typo="section heading"
                        className={css({ ...theme.spacing.rightLeft("margin", 2) })}
                    >
                        {title}
                    </Text>
                )}
                {theme.windowInnerWidth > 450 && (
                    <Text
                        typo="section heading"
                        className={css({ "fontWeight": 500 })}
                        color="focus"
                    >
                        Datalab
                    </Text>
                )}
            </div>
            {kcContext === undefined && (
                <ProjectSelect className={classes.projectSelect} />
            )}
            <div className={classes.rightEndActionsContainer}>
                {props.useCase === "core app" && (
                    <>
                        <ButtonBarButton
                            className={classes.button}
                            startIcon="training"
                            href="https://www.sspcloud.fr/documentation"
                            doOpenNewTabIfHref={true}
                        >
                            {t("trainings and tutorials")}
                        </ButtonBarButton>
                        <ButtonBarButton
                            className={classes.button}
                            startIcon="language"
                            href="https://sspcloud.fr"
                            doOpenNewTabIfHref={true}
                        >
                            {t("community space")}
                        </ButtonBarButton>
                        {props.isUserLoggedIn && (
                            <ToggleCloudShell
                                useIsCloudShellVisible={props.useIsCloudShellVisible}
                            />
                        )}
                        <Button
                            onClick={props.onAuthClick}
                            variant={props.isUserLoggedIn ? "secondary" : "primary"}
                            className={css({ "marginLeft": theme.spacing(3) })}
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
        "community space": undefined;
        "trainings and tutorials": undefined;
        project: undefined;
    };
}

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
                size="medium"
                onClick={toggleCloudShellVisibility}
            />
        );
    });

    return { ToggleCloudShell };
})();

const { ProjectSelect } = (() => {
    const labelId = "project-select-id";

    type Props = {
        className?: string;
    };

    const ProjectSelect = memo((props: Props) => {
        const { className } = props;

        const { projectsThunks, userAuthenticationThunks } = useThunks();
        const projectsState = useSelector(state =>
            !userAuthenticationThunks.getIsUserLoggedIn() ? undefined : state.projects,
        );

        const { t } = useTranslation("Header");

        const onChange = useConstCallback((event: SelectChangeEvent<string>) =>
            projectsThunks.changeProject({
                "projectId": event.target.value,
            }),
        );

        if (projectsState === undefined) {
            return null;
        }

        const { projects, selectedProjectId } = projectsState;

        if (projects.length === 1) {
            return null;
        }

        return (
            <FormControl className={className}>
                <InputLabel id={labelId}>{t("project")}</InputLabel>
                <Select
                    labelId={labelId}
                    value={selectedProjectId}
                    label="Project"
                    onChange={onChange}
                >
                    {projects.map(({ id, name }) => (
                        <MenuItem key={id} value={id}>
                            {name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    });

    return { ProjectSelect };
})();
