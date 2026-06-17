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
                        size="small"
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
        marginRight: theme.spacing(3),
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
        padding: `64px ${theme.spacing(2)}px 32px`,
        boxSizing: "border-box",
        backgroundColor: alpha(theme.colors.useCases.surfaces.background, 0.72),
        backdropFilter: "blur(1px)"
    },
    panel: {
        width: 650,
        maxWidth: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 16,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
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
        padding: `${theme.spacing(4)}px ${theme.spacing(4)}px ${theme.spacing(2)}px`,
        borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface3}`
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
        padding: `${theme.spacing(3)}px ${theme.spacing(4)}px ${theme.spacing(4)}px`,
        boxSizing: "border-box"
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
            <div>
                <img src={serviceIconUrl} />
                <Text typo="subtitle">{serviceName}</Text>
            </div>
            <Divider />
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
    root: {}
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
            <div>
                <img src={`${PUBLIC_URL}/custom-resources/assets/gitlab_logo.svg`} />
                <Text typo="object heading">Démarrer avec un projet Gitlab</Text>
                <Text typo="body 1">
                    Un {serviceName} avec votre projet Gitlab intégré automatiquement.
                </Text>
                <Text typo="caption">Cette option est facultative.</Text>
                <Button
                    onClick={() =>
                        onProceed({
                            useGitLab: true
                        })
                    }
                >
                    Démarer avec un projet GitLab
                </Button>
            </div>
            <Divider>or</Divider>
            <div>
                <Text typo="object heading">Démarrer {serviceName} immédiatement.</Text>
                <Text typo="body 1">Un {serviceName} simple sans projet GitLab.</Text>
                <Button
                    variant="secondary"
                    onClick={() =>
                        onProceed({
                            useGitLab: false
                        })
                    }
                >
                    Démarer
                </Button>
            </div>
        </div>
    );
}

const useStyles_BodyEntrypoint = tss.withName({ BodyEntrypoint }).create(({ theme }) => ({
    root: {}
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
            <div>
                <button onClick={onBack}>{"<"}</button>{" "}
                <Text typo="object heading">Démarrer avec un projet GitLab</Text>
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
    root: {}
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
            <div>
                <img src={`${PUBLIC_URL}/custom-resources/assets/gitlab_logo.svg`} />
                <Text typo="section heading">Première connexion avec GitLab</Text>
                <Text typo="body 1">
                    Pour récupérer automatiquement vos projets GitLab dans RStudio,
                    renseigne ton jeton d’accès personnel GitLab. Cette opération n’est
                    nécessaire qu’une seule fois.
                </Text>
                <Text typo="body 1">
                    En savoir plus sur :{" "}
                    <Link
                        href={`${PUBLIC_URL}/custom-resources/docs/how-to-get-my-gitlab-token.md`}
                        target="_blank"
                    >
                        Comment trouver son Jeton d’accès personnel ?
                    </Link>
                </Text>
                <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                />
                {!isTokenValid && token !== "" && (
                    <p>Token invalid, il devrais resembler à glpat_xxxxx</p>
                )}
                <Alert severity="info">
                    Le jeton sera enregistré dans votre profil pour tes prochaines
                    connexions.
                </Alert>
                <Button
                    disabled={!isTokenValid}
                    onClick={() => {
                        userConfigs.changeValue({
                            key: "githubPersonalAccessToken",
                            value: token
                        });
                    }}
                >
                    Enregister et continuer
                </Button>
            </div>
        </div>
    );
}

const useStyles_GitLabTokenView = tss.withName({ BodyGitlab }).create(({ theme }) => ({
    root: {}
}));

function GitLabUsernameView(props: { className?: string }) {
    const { className } = props;

    const { cx, classes } = useStyles_GitLabUsernameView();

    const { gitName } = useCoreState("userConfigs", "userConfigs");

    return (
        <div className={cx(classes.root, className)}>
            <img src={`${PUBLIC_URL}/custom-resources/assets/gitlab_logo.svg`} />
            <Text typo="body 1">{gitName}</Text>
            <Link
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
    root: {}
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

    const [gitlabRepoUrl, setGitlabRepoUrl] = useState("");

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
            <Text typo="subtitle">Renseigne ton répertoire GitLab</Text>
            <Text typo="body 1">
                Indique l’URL du projet GitLab à initialiser automatiquement dans{" "}
                {serviceName}.
            </Text>
            {/* TODO: The input should be a free solo input with auto complete */}
            <ul>
                {gitlabRepoUrlHistory.map(url => (
                    <li>{url}</li>
                ))}
            </ul>
            <input
                disabled={!hasToken}
                placeholder="https://gitlab.insee.fr/organization/projet"
                type="text"
                value={gitlabRepoUrl}
                onChange={e => {
                    setGitlabRepoUrl(e.target.value);
                }}
            />
            {!isUrlValid && <p>GitLab repo non valid</p>}
            <Button
                disabled={!isUrlValid}
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
    );
}

const useStyles_GitLabRepoView = tss.withName({ GitLabRepoView }).create(({ theme }) => ({
    root: {}
}));
