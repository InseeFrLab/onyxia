import { memo } from "react";
import { Button } from "onyxia-ui/Button";
import { ButtonBarButton } from "onyxia-ui/ButtonBarButton";
import { useTranslation } from "ui/i18n";
import { useConstCallback } from "powerhooks/useConstCallback";
import { tss } from "ui/theme";
import { Text } from "onyxia-ui/Text";
import { ReactComponent as OnyxiaLogoSvg } from "ui/assets/svg/OnyxiaLogo.svg";
import {
    HEADER_ORGANIZATION,
    HEADER_USECASE_DESCRIPTION
} from "keycloak-theme/login/envCarriedOverToKc";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { getHeaderLinksFromEnv } from "ui/env";
import { getDoHideOnyxia } from "ui/env";
import { useResolveLocalizedString } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";

export type Props = Props.LoginPages | Props.CoreApp;
export declare namespace Props {
    export type Common = {
        className?: string;
        logoContainerWidth: number;
        onLogoClick(): void;
    };

    export type LoginPages = Common & {
        useCase: "login pages";
    };

    export type CoreApp = Common & {
        useCase: "core app";
        regionSelectProps: RegionSelectProps | undefined;
        projectSelectProps: ProjectSelectProps | undefined;
        auth:
            | {
                  isUserLoggedIn: false;
                  onLoginClick: () => void;
              }
            | {
                  isUserLoggedIn: true;
                  onLogoutClick: () => void;
              };
    };
}

export const Header = memo((props: Props) => {
    const { className, logoContainerWidth, onLogoClick } = props;

    const { t } = useTranslation({ Header });

    const { classes, cx, css, theme } = useStyles({ logoContainerWidth });

    const { resolveLocalizedString } = useResolveLocalizedString({
        "labelWhenMismatchingLanguage": true
    });

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

            {props.useCase === "core app" && (
                <>
                    {props.regionSelectProps !== undefined && (
                        <RegionSelect
                            {...props.regionSelectProps}
                            className={cx(
                                classes.regionSelect,
                                props.regionSelectProps.className
                            )}
                        />
                    )}
                    {props.projectSelectProps !== undefined && (
                        <ProjectSelect
                            {...props.projectSelectProps}
                            className={cx(
                                classes.projectSelect,
                                props.projectSelectProps.className
                            )}
                        />
                    )}
                </>
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

                        <Button
                            onClick={
                                props.auth.isUserLoggedIn
                                    ? props.auth.onLogoutClick
                                    : props.auth.onLoginClick
                            }
                            variant={props.auth.isUserLoggedIn ? "secondary" : "primary"}
                            className={css({ "marginLeft": theme.spacing(3) })}
                        >
                            {t(props.auth.isUserLoggedIn ? "logout" : "login")}
                        </Button>
                    </>
                )}
            </div>
        </header>
    );
});

export const { i18n } = declareComponentKeys<"logout" | "login" | "project" | "region">()(
    {
        Header
    }
);

const useStyles = tss
    .withParams<{ logoContainerWidth: number }>()
    .withName({ Header })
    .create(({ theme, logoContainerWidth }) => ({
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
            "marginLeft": theme.spacing(4)
        },
        "regionSelect": {
            "marginLeft": theme.spacing(4)
        }
    }));

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

type RegionSelectProps = {
    className?: string;
    availableDeploymentRegionIds: string[];
    selectedDeploymentRegionId: string;
    onDeploymentRegionChange: (params: { deploymentRegionId: string }) => void;
};

const RegionSelect = memo((props: RegionSelectProps) => {
    const {
        className,
        onDeploymentRegionChange,
        selectedDeploymentRegionId,
        availableDeploymentRegionIds
    } = props;

    const { t } = useTranslation({ Header });

    const onChange = useConstCallback(async (event: SelectChangeEvent<string>) => {
        onDeploymentRegionChange({
            "deploymentRegionId": event.target.value
        });
    });

    return (
        <FormControl className={className}>
            <InputLabel id={labelId}>{t("region")}</InputLabel>
            <Select
                labelId={labelId}
                value={selectedDeploymentRegionId}
                label={t("region")}
                onChange={onChange}
            >
                {availableDeploymentRegionIds.map(deploymentRegionId => (
                    <MenuItem key={deploymentRegionId} value={deploymentRegionId}>
                        {deploymentRegionId}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
});
