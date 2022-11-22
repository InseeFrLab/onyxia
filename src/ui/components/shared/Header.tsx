import { memo } from "react";
import { /*IconButton, */ Button, ButtonBarButton } from "ui/theme";
import { useTranslation } from "ui/i18n";
import { useConstCallback } from "powerhooks/useConstCallback";
import { makeStyles, Text } from "ui/theme";
import type { useIsCloudShellVisible } from "js/components/cloud-shell/cloud-shell";
import { ReactComponent as OnyxiaLogoSvg } from "ui/assets/svg/OnyxiaLogo.svg";
import { HEADER_ORGANIZATION, HEADER_USECASE_DESCRIPTION } from "ui/envCarriedOverToKc";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { getHeaderLinksFromEnv } from "ui/env";
import { getDoHideOnyxia } from "ui/env";
import { useResolveLocalizedString } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";

export type Props = Props.LoginPages | Props.UserNotLoggedIn | Props.UserLoggedIn;
export declare namespace Props {
    export type Common = {
        className?: string;
        logoContainerWidth: number;
        onLogoClick(): void;
    };

    export type LoginPages = Common & {
        useCase: "login pages";
    };

    export type UserNotLoggedIn = Common & {
        useCase: "core app";
        isUserLoggedIn: false;
        onLoginClick: () => void;
    };

    export type UserLoggedIn = Common & {
        useCase: "core app";
        isUserLoggedIn: true;
        useIsCloudShellVisible: typeof useIsCloudShellVisible;
        onLogoutClick: () => void;
    } & Omit<ProjectSelectProps, "className">;
}

export const Header = memo((props: Props) => {
    const { className, logoContainerWidth, onLogoClick } = props;

    const { t } = useTranslation({ Header });

    const { classes, cx, css, theme } = useStyles({ logoContainerWidth });

    const { resolveLocalizedString } = useResolveLocalizedString();

    const doShowOnyxia = props.useCase === "core app" && !getDoHideOnyxia();

    return (
        <header className={cx(classes.root, className)}>
            <div onClick={onLogoClick} className={classes.logoContainer}>
                <OnyxiaLogoSvg className={classes.svg} />
            </div>
            <div onClick={onLogoClick} className={classes.mainTextContainer}>
                {doShowOnyxia && (
                    <Text typo="section heading" className={css({ "fontWeight": 600 })}>
                        Onyxia -
                    </Text>
                )}
                {HEADER_ORGANIZATION && (
                    <Text
                        typo="section heading"
                        className={cx(css({ ...theme.spacing.rightLeft("margin", 2) }), {
                            [css({ "marginLeft": 0 })]: !doShowOnyxia
                        })}
                    >
                        {HEADER_ORGANIZATION}
                    </Text>
                )}
                {theme.windowInnerWidth > 450 && HEADER_USECASE_DESCRIPTION && (
                    <Text
                        typo="section heading"
                        className={css({ "fontWeight": 500 })}
                        color="focus"
                    >
                        {HEADER_USECASE_DESCRIPTION}
                    </Text>
                )}
            </div>
            {props.useCase === "core app" && props.isUserLoggedIn && (
                <ProjectSelect {...props} className={classes.projectSelect} />
            )}
            <div className={classes.rightEndActionsContainer}>
                {props.useCase === "core app" && (
                    <>
                        {(() => {
                            const headerLinksFromEnv = getHeaderLinksFromEnv();

                            if (headerLinksFromEnv === undefined) {
                                return null;
                            }

                            return headerLinksFromEnv.map(({ iconId, url, label }) => (
                                <ButtonBarButton
                                    key={url}
                                    className={classes.button}
                                    startIcon={iconId as any}
                                    href={url}
                                    doOpenNewTabIfHref={true}
                                >
                                    {resolveLocalizedString(label)}
                                </ButtonBarButton>
                            ));
                        })()}

                        {/*TODO: Debug CloudShell
                        props.isUserLoggedIn && (
                            <ToggleCloudShell
                                useIsCloudShellVisible={props.useIsCloudShellVisible}
                            />
                        )*/}
                        <Button
                            onClick={
                                props.isUserLoggedIn
                                    ? props.onLogoutClick
                                    : props.onLoginClick
                            }
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

export const { i18n } = declareComponentKeys<
    "logout" | "login" | "project" | "trainings" | "documentation"
>()({
    Header
});

const useStyles = makeStyles<{ logoContainerWidth: number }>({ "name": { Header } })(
    (theme, { logoContainerWidth }) => ({
        "root": {
            "backgroundColor": theme.colors.useCases.surfaces.background,
            "overflow": "auto",
            "display": "flex",
            "alignItems": "center",
            ...theme.spacing.topBottom("padding", 2)
        },
        "logoContainer": {
            "cursor": "pointer",
            "width": logoContainerWidth,
            "textAlign": "center",
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center"
        },
        "mainTextContainer": {
            "cursor": "pointer",
            "& > *": {
                "display": "inline"
            }
        },
        "svg": {
            "fill": theme.colors.useCases.typography.textFocus,
            "width": "70%"
        },
        "button": {
            "marginBottom": theme.spacing(1)
        },
        "rightEndActionsContainer": {
            "flex": 1,
            "display": "flex",
            "justifyContent": "flex-end",
            "alignItems": "center"
        },
        "projectSelect": {
            "marginLeft": theme.spacing(2)
        }
    })
);

/*
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
*/

const labelId = "project-select-id";

type ProjectSelectProps = {
    className?: string;
    onSelectedProjectChange: (params: { projectId: string }) => void;
    selectedProjectId: string;
    projects: {
        id: string;
        name: string;
    }[];
};

const ProjectSelect = memo((props: ProjectSelectProps) => {
    const { className, projects, onSelectedProjectChange, selectedProjectId } = props;

    const { t } = useTranslation({ Header });

    const onChange = useConstCallback(async (event: SelectChangeEvent<string>) => {
        onSelectedProjectChange({
            "projectId": event.target.value
        });
    });

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
