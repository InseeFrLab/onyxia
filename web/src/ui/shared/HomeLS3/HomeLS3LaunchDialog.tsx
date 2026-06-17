import { type Evt, type UnpackEvt } from "evt";
import { useEvt } from "evt/hooks/useEvt";
import { useEffect, useState, type MouseEvent, type ReactNode, useMemo } from "react";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { IconButton } from "onyxia-ui/IconButton";
import { getIconUrlByName } from "lazy-icons";
import { alpha } from "@mui/material/styles";
import { keyframes } from "tss-react";
import { assert, id } from "tsafe";
import Divider from "@mui/material/Divider";
import { PUBLIC_URL } from "env";
import { Button } from "onyxia-ui/Button";
import { useCoreState, getCoreSync } from "core";
import { createUseGlobalState } from "powerhooks/useGlobalState";
import Link from "@mui/material/Link";
import { Alert } from "onyxia-ui/Alert";
import { routes } from "ui/routes";
import { TextField } from "onyxia-ui/TextField";

export type Props_HomeLS3LaunchDialog = {
    evtOpen: Evt<{
        serviceIconUrl: string;
        serviceName: string;
        onUserResponse: (
            params:
                | {
                      response: "cancel" | "launch without git repo";
                  }
                | {
                      response: "launch with git repo";
                      gitlabRepoUrl: string;
                  }
        ) => void;
    }>;
};

export function HomeLS3LaunchDialog(props: Props_HomeLS3LaunchDialog) {
    const { evtOpen } = props;

    const [state, setState] = useState<
        UnpackEvt<Props_HomeLS3LaunchDialog["evtOpen"]> | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, setState);
        },
        [evtOpen]
    );

    const onCancel = () => {
        assert(state !== undefined);
        state.onUserResponse({ response: "cancel" });
        setState(undefined);
    };

    if (state === undefined) {
        return null;
    }

    return (
        <SideDialog title="Démarrage rapide" onClose={onCancel}>
            <Body
                serviceName={state.serviceName}
                serviceIconUrl={state.serviceIconUrl}
                onProceed={({ gitlabRepoUrl }) => {
                    assert(state !== undefined);

                    state.onUserResponse(
                        gitlabRepoUrl === undefined
                            ? {
                                  response: "launch without git repo"
                              }
                            : {
                                  response: "launch with git repo",
                                  gitlabRepoUrl
                              }
                    );

                    setState(undefined);
                }}
            />
        </SideDialog>
    );
}

function SideDialog(props: {
    title: ReactNode;
    onClose: () => void;
    children: ReactNode;
}) {
    const { children, title, onClose } = props;

    const { classes } = useStyles_SideDialog();

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return;
            }

            onClose();
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [onClose]);

    const onRootClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) {
            return;
        }
        onClose();
    };

    return (
        <div className={classes.root} onClick={onRootClick}>
            <div
                className={classes.panel}
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === "string" ? title : undefined}
            >
                <div className={classes.headingWrapper}>
                    <Text typo="section heading" className={classes.title}>
                        {title}
                    </Text>
                    <IconButton
                        className={classes.closeButton}
                        size="default"
                        icon={getIconUrlByName("Close")}
                        onClick={onClose}
                    />
                </div>

                <div className={classes.childrenWrapper}>{children}</div>
            </div>
        </div>
    );
}

const useStyles_SideDialog = tss.withName({ SideDialog }).create(({ theme }) => ({
    root: {
        position: "fixed",
        inset: 0,
        zIndex: theme.muiTheme.zIndex.modal,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
        padding: `32px ${theme.spacing(3)}px 24px`,
        boxSizing: "border-box",
        backgroundColor: alpha(theme.colors.useCases.surfaces.background, 0.72),
        backdropFilter: "blur(1px)",
        [theme.muiTheme.breakpoints.down("sm")]: {
            padding: theme.spacing(2)
        }
    },
    panel: {
        ...theme.spacing.topBottom("padding", 5),
        ...theme.spacing.rightLeft("padding", 6),
        width: 680,
        maxWidth: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 16,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        boxShadow: theme.shadows[4],
        animation: `${keyframes`
            from {
                opacity: 0;
                transform: translateX(28px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        `} 340ms cubic-bezier(0.2, 0, 0, 1)`
    },
    headingWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        borderBottom: `1px solid ${theme.colors.useCases.typography.textTertiary}`
    },
    title: {
        minWidth: 0,
        color: theme.colors.useCases.typography.textPrimary
    },
    closeButton: {
        flex: "none"
    },
    childrenWrapper: {
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        display: "flex",
        boxSizing: "border-box",
        [theme.muiTheme.breakpoints.down("sm")]: {
            paddingRight: theme.spacing(2),
            paddingLeft: theme.spacing(2)
        }
    }
}));

function Body(props: {
    className?: string;
    serviceIconUrl: string;
    serviceName: string;
    onProceed: (params: { gitlabRepoUrl: string | undefined }) => void;
}) {
    const { className, serviceIconUrl, serviceName, onProceed } = props;

    const { cx, classes } = useStyles_Body();

    const [isEntrypoint, setIsEntrypoint] = useState(true);

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.serviceHeader}>
                <img className={classes.serviceIcon} src={serviceIconUrl} />
                <Text className={classes.serviceName} typo="object heading">
                    {serviceName}
                </Text>
            </div>
            <Divider className={classes.serviceDivider} />
            {isEntrypoint ? (
                <BodyEntrypoint
                    serviceName={serviceName}
                    onProceed={({ useGitLab }) => {
                        if (!useGitLab) {
                            onProceed({
                                gitlabRepoUrl: undefined
                            });
                            return;
                        }
                        setIsEntrypoint(false);
                    }}
                />
            ) : (
                <BodyGitlab
                    serviceName={serviceName}
                    onBack={() => {
                        setIsEntrypoint(true);
                    }}
                    onProceed={({ gitlabRepoUrl }) => {
                        onProceed({ gitlabRepoUrl });
                    }}
                />
            )}
        </div>
    );
}

const useStyles_Body = tss.withName({ Body }).create(({ theme }) => ({
    root: {
        flex: 1,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column"
    },
    serviceHeader: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(3),
        padding: `${theme.spacing(4)}px ${theme.spacing(2)}px ${theme.spacing(3)}px`
    },
    serviceIcon: {
        width: 52,
        height: 52,
        objectFit: "contain",
        flex: "none"
    },
    serviceName: {
        color: theme.colors.useCases.typography.textPrimary
    },
    serviceDivider: {
        borderColor: theme.colors.useCases.surfaces.surface2
    }
}));

function BodyEntrypoint(props: {
    className?: string;
    serviceName: string;
    onProceed: (params: { useGitLab: boolean }) => void;
}) {
    const { className, serviceName, onProceed } = props;

    const { cx, classes } = useStyles_BodyEntrypoint();

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.gitlabCard}>
                <img
                    className={classes.gitlabLogo}
                    src={`${PUBLIC_URL}/custom-resources/assets/gitlab_logo.svg`}
                />
                <Text className={classes.gitlabTitle} typo="section heading">
                    Démarrer avec un projet GitLab
                </Text>
                <Text className={classes.description} typo="body 1">
                    Un {serviceName} avec votre projet GitLab intégré automatiquement.
                </Text>
                <div className={classes.gitlabCardFooter}>
                    <Text className={classes.optionalText} typo="label 1">
                        Cette option est facultative.
                    </Text>
                    <Button
                        onClick={() =>
                            onProceed({
                                useGitLab: true
                            })
                        }
                    >
                        Démarrer avec un projet GitLab
                    </Button>
                </div>
            </div>
            <Divider
                className={classes.orDivider}
                classes={{
                    wrapper: classes.orDivider_wrapper
                }}
            >
                ou
            </Divider>
            <div className={classes.quickStartCard}>
                <div className={classes.quickStartText}>
                    <Text className={classes.quickStartTitle} typo="label 1">
                        Démarrer un {serviceName} immédiatement.
                    </Text>
                    <Text className={classes.description} typo="body 1">
                        Un {serviceName} simple sans projet GitLab.
                    </Text>
                </div>
                <Button
                    variant="secondary"
                    onClick={() =>
                        onProceed({
                            useGitLab: false
                        })
                    }
                >
                    Démarrer
                </Button>
            </div>
        </div>
    );
}

const useStyles_BodyEntrypoint = tss.withName({ BodyEntrypoint }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        paddingTop: theme.spacing(3)
    },
    gitlabCard: {
        borderRadius: 16,
        padding: theme.spacing(5),
        backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
    },
    gitlabLogo: {
        width: 58,
        height: 58,
        objectFit: "contain",
        marginBottom: theme.spacing(2)
    },
    gitlabTitle: {
        color: theme.colors.useCases.typography.textPrimary
    },
    description: {
        marginTop: theme.spacing(1),
        color: theme.colors.useCases.typography.textSecondary
    },
    gitlabCardFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(3),
        marginTop: theme.spacing(5),
        [theme.muiTheme.breakpoints.down("sm")]: {
            alignItems: "stretch",
            flexDirection: "column"
        }
    },
    optionalText: {
        color: theme.colors.useCases.typography.textPrimary
    },
    orDivider: {
        color: theme.colors.useCases.typography.textSecondary,
        "&::before, &::after": {
            borderColor: theme.colors.useCases.surfaces.surface2
        },
        ...theme.spacing.topBottom("margin", 6)
    },
    orDivider_wrapper: {
        ...theme.spacing.rightLeft("padding", 3)
    },
    quickStartCard: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(3),
        padding: theme.spacing(5),
        borderRadius: 16,
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    quickStartText: {
        minWidth: 0
    },
    quickStartTitle: {
        color: theme.colors.useCases.typography.textPrimary
    }
}));

function BodyGitlab(props: {
    className?: string;
    onBack: () => void;
    serviceName: string;
    onProceed: (params: { gitlabRepoUrl: string }) => void;
}) {
    const { className, onBack, serviceName, onProceed } = props;

    const { cx, classes } = useStyles_BodyGitlab();

    const { githubPersonalAccessToken } = useCoreState("userConfigs", "userConfigs");

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.header}>
                <IconButton
                    className={classes.backButton}
                    icon={getIconUrlByName("KeyboardArrowLeft")}
                    size="default"
                    aria-label="Retour"
                    onClick={onBack}
                />
                <Text className={classes.title} typo="section heading">
                    Démarrer avec un projet GitLab
                </Text>
            </div>

            {!githubPersonalAccessToken ? <GitLabTokenView /> : <GitLabUsernameView />}

            <GitLabRepoView
                serviceName={serviceName}
                hasToken={!!githubPersonalAccessToken}
                onProceed={onProceed}
            />
        </div>
    );
}

const useStyles_BodyGitlab = tss.withName({ BodyGitlab }).create(({ theme }) => ({
    root: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        paddingTop: theme.spacing(3)
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        marginBottom: theme.spacing(4)
    },
    backButton: {
        flex: "none",
        marginLeft: -theme.spacing(2)
    },
    title: {
        color: theme.colors.useCases.typography.textPrimary
    }
}));

function GitLabTokenView(props: { className?: string }) {
    const { className } = props;

    const {
        functions: { userConfigs }
    } = getCoreSync();

    const [token, setToken] = useState("");

    const { cx, classes } = useStyles_GitLabTokenView();

    const isTokenValid = useMemo(() => {
        if (!token.startsWith("glpat-")) {
            return false;
        }

        return true;
    }, [token]);

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.card}>
                <img
                    className={classes.gitlabLogo}
                    src={`${PUBLIC_URL}/custom-resources/assets/gitlab_logo.svg`}
                />
                <div className={classes.content}>
                    <Text typo="object heading">Première connexion avec GitLab</Text>
                    <Text className={classes.description} typo="body 1">
                        Pour récupérer automatiquement vos projets GitLab dans RStudio,
                        renseigne ton jeton d’accès personnel GitLab. Cette opération
                        n’est nécessaire qu’une seule fois.
                    </Text>
                </div>
                <div className={classes.inputWrapper}>
                    <TextField
                        className={classes.input}
                        type="sensitive"
                        // @ts-expect-error: Trust me bro
                        placeholder="Jeton d’accès personnel"
                        defaultValue={token}
                        onValueBeingTypedChange={({ value }) => {
                            setToken(value);
                        }}
                        helperTextError={
                            !isTokenValid && token !== ""
                                ? "Le jeton devrait ressembler à glpat-xxxxx."
                                : undefined
                        }
                        doOnlyShowErrorAfterFirstFocusLost={false}
                    />
                </div>
                <Text className={classes.helpText} typo="label 1">
                    En savoir plus sur :{" "}
                    <Link
                        {...routes.document({
                            source: `${PUBLIC_URL}/custom-resources/docs/how-to-get-my-gitlab-token.md`
                        }).link}
                        target="_blank"
                    >
                        Comment trouver son Jeton d’accès personnel ?
                    </Link>
                </Text>
                <Alert
                    className={classes.infoAlert}
                    severity="info"
                    classes={{
                        icon: classes.infoAlert_icon
                    }}
                >
                    Le jeton sera enregistré dans votre profil pour tes prochaines
                    connexions.
                </Alert>
                <Button
                    className={classes.submitButton}
                    disabled={!isTokenValid}
                    onClick={() => {
                        userConfigs.changeValue({
                            key: "githubPersonalAccessToken",
                            value: token
                        });
                    }}
                >
                    Enregistrer et continuer
                </Button>
            </div>
        </div>
    );
}

const useStyles_GitLabTokenView = tss
    .withName({ GitLabTokenView })
    .create(({ theme }) => ({
        root: {
            marginBottom: theme.spacing(4)
        },
        card: {
            display: "grid",
            gridTemplateColumns: "92px 1fr",
            columnGap: theme.spacing(3),
            rowGap: theme.spacing(2),
            ...theme.spacing.topBottom("padding", 6),
            ...theme.spacing.rightLeft("padding", 3),
            borderRadius: 16,
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        gitlabLogo: {
            gridRow: "1 / span 2",
            width: 74,
            height: 74,
            objectFit: "contain",
            alignSelf: "center",
            justifySelf: "center",
            [theme.muiTheme.breakpoints.down("sm")]: {
                alignSelf: "flex-start"
            }
        },
        content: {
            minWidth: 0
        },
        description: {
            marginTop: theme.spacing(1),
            color: theme.colors.useCases.typography.textSecondary
        },
        inputWrapper: {
            gridColumn: "1 / -1",
            position: "relative",
            display: "flex",
            alignItems: "center",
            marginTop: theme.spacing(2)
        },
        input: {
            width: "100%",
            marginBottom: theme.spacing(5)
        },
        helpText: {
            gridColumn: "1 / -1",
            color: theme.colors.useCases.typography.textPrimary
        },
        infoAlert: {
            gridColumn: "1 / -1",
            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1,
            borderRadius: 16,
            ...theme.spacing.topBottom("margin", 3)
        },
        infoAlert_icon: {
            "& > svg": {
                color: theme.colors.useCases.typography.textFocus
            }
        },
        submitButton: {
            "&&": {
                gridColumn: "1 / -1",
                justifySelf: "end",
                whiteSpace: "nowrap"
            }
        }
    }));

function GitLabUsernameView(props: { className?: string }) {
    const { className } = props;

    const { cx, classes } = useStyles_GitLabUsernameView();

    const { gitName } = useCoreState("userConfigs", "userConfigs");

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.accountSummary}>
                <img
                    className={classes.gitlabLogo}
                    src={`${PUBLIC_URL}/custom-resources/assets/gitlab_logo.svg`}
                />
                <Text className={classes.username} typo="body 1">
                    {gitName}
                </Text>
            </div>
            <Link
                className={classes.settingsLink}
                {...routes.account({
                    tabId: "git"
                }).link}
            >
                Voir les paramètres de connexion {">"}
            </Link>
        </div>
    );
}

const useStyles_GitLabUsernameView = tss.withName({ BodyGitlab }).create(({ theme }) => ({
    root: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        padding: `${theme.spacing(2)}px ${theme.spacing(3)}px`,
        marginBottom: theme.spacing(4),
        borderRadius: 14,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        [theme.muiTheme.breakpoints.down("sm")]: {
            alignItems: "flex-start",
            flexDirection: "column"
        }
    },
    accountSummary: {
        display: "flex",
        alignItems: "center",
        minWidth: 0,
        gap: theme.spacing(1)
    },
    gitlabLogo: {
        width: 26,
        height: 26,
        objectFit: "contain",
        flex: "none"
    },
    username: {
        color: theme.colors.useCases.typography.textPrimary,
        fontWeight: 700,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    settingsLink: {
        flex: "none",
        color: theme.colors.useCases.typography.textPrimary,
        textDecoration: "none",
        fontWeight: 700,
        "&:hover": {
            color: theme.colors.useCases.typography.textFocus,
            textDecoration: "none"
        },
        [theme.muiTheme.breakpoints.down("sm")]: {
            flex: "initial"
        }
    }
}));

const { useGitlabRepoUrlHistory } = createUseGlobalState({
    doPersistAcrossReloads: true,
    initialState: id<string[]>([]),
    name: "gitlabRepoUrlHistory"
});

function GitLabRepoView(props: {
    className?: string;
    serviceName: string;
    hasToken: boolean;
    onProceed: (params: { gitlabRepoUrl: string }) => void;
}) {
    const { className, serviceName, hasToken, onProceed } = props;

    const { gitlabRepoUrlHistory, setGitlabRepoUrlHistory } = useGitlabRepoUrlHistory();

    const { cx, classes } = useStyles_GitLabRepoView();

    const [gitlabRepoUrl, setGitlabRepoUrl] = useState(gitlabRepoUrlHistory.at(-1) ?? "");

    const isUrlValid = useMemo(() => {
        let urlObj: URL;

        try {
            urlObj = new URL(gitlabRepoUrl);
        } catch {
            return false;
        }

        if (urlObj.host.toLocaleLowerCase() !== "gitlab.insee.fr") {
            return false;
        }

        return true;
    }, [gitlabRepoUrl]);

    return (
        <div className={cx(classes.root, className)}>
            <Text className={classes.title} typo="object heading">
                Renseigne ton répertoire GitLab
            </Text>
            <Text className={classes.description} typo="body 1">
                Indique l’URL du projet GitLab à initialiser automatiquement dans{" "}
                {serviceName}.
            </Text>
            <TextField
                className={classes.input}
                disabled={!hasToken}
                // @ts-expect-error
                placeholder="Par exemple : https://gitlab.insee.fr/equipe/projet-1"
                defaultValue={gitlabRepoUrl}
                onValueBeingTypedChange={params => {
                    setGitlabRepoUrl(params.value);
                }}
                freeSolo
                options={gitlabRepoUrlHistory}
                helperTextError={
                    !isUrlValid && gitlabRepoUrl !== ""
                        ? "L’URL doit pointer vers un projet GitLab INSEE."
                        : undefined
                }
                doOnlyShowErrorAfterFirstFocusLost={false}
            />
            <div className={classes.actionWrapper}>
                <Button
                    disabled={!hasToken || !isUrlValid}
                    onClick={() => {
                        setGitlabRepoUrlHistory([...gitlabRepoUrlHistory, gitlabRepoUrl]);

                        onProceed({
                            gitlabRepoUrl
                        });
                    }}
                >
                    Démarrer avec ce projet
                </Button>
            </div>
        </div>
    );
}

const useStyles_GitLabRepoView = tss.withName({ GitLabRepoView }).create(({ theme }) => ({
    root: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column"
    },
    title: {
        color: theme.colors.useCases.typography.textPrimary
    },
    description: {
        marginTop: theme.spacing(1),
        color: theme.colors.useCases.typography.textSecondary
    },
    input: {
        marginTop: theme.spacing(3)
    },
    actionWrapper: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "auto",
        paddingTop: theme.spacing(4)
    }
}));
