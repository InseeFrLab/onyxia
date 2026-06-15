import { memo, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { assert, id } from "tsafe";
import { Evt, type UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { createUseGlobalState } from "powerhooks/useGlobalState";
import { useCoreState, getCoreSync } from "core";
import { TextField, type TextFieldProps } from "onyxia-ui/TextField";
import { Text } from "onyxia-ui/Text";
import { useConst } from "powerhooks/useConst";
import Link from "@mui/material/Link";
import { PUBLIC_URL } from "env";
import { tss } from "tss";
import { getIconUrlByName } from "lazy-icons";

export type Props_HomeLS3GitDialog = {
    evtOpen: Evt<{
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

export const HomeLS3GitDialog = memo((props: Props_HomeLS3GitDialog) => {
    const { evtOpen } = props;

    const [state, setState] = useState<
        UnpackEvt<Props_HomeLS3GitDialog["evtOpen"]> | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, setState);
        },
        [evtOpen]
    );

    const onCancel = () => {
        state?.onUserResponse({ response: "cancel" });
        setState(undefined);
    };

    return (
        <Dialog
            title="Préparer le lancement"
            subtitle={
                state === undefined
                    ? undefined
                    : `Clonage GitLab optionnel pour ${state.serviceName}`
            }
            isOpen={state !== undefined}
            maxWidth="md"
            showCloseButton
            body={
                state === undefined ? undefined : (
                    <Body
                        serviceName={state.serviceName}
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
                )
            }
            onClose={onCancel}
        />
    );
});

const GITLAB_TOKEN_REGEXP = /^glpat-[A-Za-z0-9_-]{20,}$/;

const GITLAB_REPO_REGEXP =
    /^(?:(?:https?:\/\/)(?:[^/@\s]+@)?[^/\s]+\/|git@[^:\s]+:)[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)+(?:\.git)?$/;

const { useGitlabRepoUrl } = createUseGlobalState({
    name: "gitlabRepoUrl",
    doPersistAcrossReloads: true,
    initialState: id<string | undefined>(undefined)
});

function normalizeOptionalValue(value: string): string | undefined {
    const trimmedValue = value.trim();

    return trimmedValue === "" ? undefined : trimmedValue;
}

function Body(props: {
    serviceName: string;
    onProceed: (params: { gitlabRepoUrl: string | undefined }) => void;
}) {
    const { serviceName, onProceed } = props;

    const { githubPersonalAccessToken } = useCoreState("userConfigs", "userConfigs");
    const {
        functions: { userConfigs }
    } = getCoreSync();

    const evtTokenTextFieldAction = useConst(() =>
        Evt.create<UnpackEvt<TextFieldProps["evtAction"]>>()
    );
    const evtRepoTextFieldAction = useConst(() =>
        Evt.create<UnpackEvt<TextFieldProps["evtAction"]>>()
    );

    const [isTokenValid, setIsTokenValid] = useState(false);
    const [isRepoUrlValid, setIsRepoUrlValid] = useState(true);

    const { gitlabRepoUrl, setGitlabRepoUrl } = useGitlabRepoUrl();

    const hasGitlabToken =
        normalizeOptionalValue(githubPersonalAccessToken ?? "") !== undefined;
    const normalizedGitlabRepoUrl = normalizeOptionalValue(gitlabRepoUrl ?? "");

    const doInjectGitUrl =
        hasGitlabToken && normalizedGitlabRepoUrl !== undefined && isRepoUrlValid;

    const { classes } = useStyles();

    const launchWithoutGitRepo = () => {
        onProceed({ gitlabRepoUrl: undefined });
    };

    const launchWithGitRepo = () => {
        assert(doInjectGitUrl);
        onProceed({ gitlabRepoUrl: normalizedGitlabRepoUrl });
    };

    return (
        <div className={classes.root}>
            <div className={classes.stepper} aria-hidden="true">
                <Step
                    index={1}
                    label="Jeton GitLab"
                    state={hasGitlabToken ? "complete" : "active"}
                />
                <div className={classes.stepDivider} />
                <Step
                    index={2}
                    label="Dépôt à cloner"
                    state={hasGitlabToken ? "active" : "pending"}
                />
            </div>

            {!hasGitlabToken ? (
                <>
                    <Text typo="body 1" className={classes.lead}>
                        Pour cloner un dépôt GitLab privé au démarrage, Onyxia doit
                        disposer d'un Personal Access Token GitLab. Le jeton sera
                        enregistré dans votre configuration utilisateur.
                    </Text>

                    <p className={classes.note}>
                        Cette étape est facultative : vous pouvez lancer le service
                        maintenant sans cloner de dépôt Git.
                    </p>

                    <TextField
                        label="Personal Access Token GitLab"
                        type="sensitive"
                        className={classes.textField}
                        defaultValue=""
                        helperText={
                            <>
                                Format attendu : glpat-xxxxxxxxxxxxxxxxxxxx. Pour le
                                créer, consultez{" "}
                                <Link
                                    target="_blank"
                                    rel="noreferrer"
                                    href={`${PUBLIC_URL}custom-resources-example/ls3/docs/how-to-get-my-gitlab-token.md`}
                                >
                                    le guide Insee
                                </Link>
                                .
                            </>
                        }
                        selectAllTextOnFocus={true}
                        doOnlyShowErrorAfterFirstFocusLost={false}
                        inputProps_autoFocus={true}
                        inputProps_spellCheck={false}
                        evtAction={evtTokenTextFieldAction}
                        onSubmit={token => {
                            userConfigs.changeValue({
                                key: "githubPersonalAccessToken",
                                value: token.trim()
                            });
                        }}
                        getIsValidValue={token => {
                            if (!GITLAB_TOKEN_REGEXP.test(token.trim())) {
                                return {
                                    isValidValue: false,
                                    message: (
                                        <>
                                            Le jeton doit commencer par glpat- et contenir
                                            au moins 20 caractères.
                                        </>
                                    )
                                };
                            }

                            return {
                                isValidValue: true
                            };
                        }}
                        onValueBeingTypedChange={params => {
                            setIsTokenValid(params.isValidValue);
                        }}
                    />
                </>
            ) : (
                <>
                    <Text typo="body 1" className={classes.lead}>
                        Vous pouvez indiquer l'URL d'un dépôt GitLab à cloner
                        automatiquement dans le service. L'URL est mémorisée sur ce
                        navigateur pour les prochains lancements.
                    </Text>

                    <p className={classes.note}>
                        Laisser le champ vide, ou choisir "Lancer sans dépôt Git", démarre{" "}
                        {serviceName} normalement.
                    </p>

                    <TextField
                        label="URL du dépôt GitLab"
                        helperText={
                            <>
                                Exemples : https://gitlab.example.fr/groupe/projet.git ou
                                git@gitlab.example.fr:groupe/projet.git
                            </>
                        }
                        className={classes.textField}
                        doOnlyShowErrorAfterFirstFocusLost={false}
                        defaultValue={gitlabRepoUrl ?? ""}
                        evtAction={evtRepoTextFieldAction}
                        inputProps_autoFocus={true}
                        inputProps_spellCheck={false}
                        selectAllTextOnFocus={true}
                        onEnterKeyDown={({ preventDefaultAndStopPropagation }) => {
                            if (!doInjectGitUrl) {
                                return;
                            }

                            preventDefaultAndStopPropagation();
                            launchWithGitRepo();
                        }}
                        getIsValidValue={value => {
                            const normalizedValue = normalizeOptionalValue(value);

                            if (
                                normalizedValue !== undefined &&
                                !GITLAB_REPO_REGEXP.test(normalizedValue)
                            ) {
                                return {
                                    isValidValue: false,
                                    message: <>Cette URL GitLab n'est pas reconnue.</>
                                };
                            }

                            return {
                                isValidValue: true
                            };
                        }}
                        onValueBeingTypedChange={params => {
                            setIsRepoUrlValid(params.isValidValue);
                            if (params.isValidValue) {
                                setGitlabRepoUrl(normalizeOptionalValue(params.value));
                            }
                        }}
                    />
                </>
            )}

            <div className={classes.actions}>
                <Button
                    onClick={launchWithoutGitRepo}
                    variant="secondary"
                    startIcon={getIconUrlByName("SkipNext")}
                >
                    Lancer sans dépôt Git
                </Button>

                {!hasGitlabToken ? (
                    <Button
                        onClick={() => evtTokenTextFieldAction.post("TRIGGER SUBMIT")}
                        disabled={!isTokenValid}
                        startIcon={getIconUrlByName("Key")}
                    >
                        Enregistrer le jeton
                    </Button>
                ) : (
                    <Button
                        onClick={launchWithGitRepo}
                        disabled={!doInjectGitUrl}
                        startIcon={getIconUrlByName("RocketLaunch")}
                    >
                        Lancer avec ce dépôt
                    </Button>
                )}
            </div>
        </div>
    );
}

function Step(props: {
    index: number;
    label: string;
    state: "active" | "complete" | "pending";
}) {
    const { index, label, state } = props;

    const { classes, cx } = useStyles();

    return (
        <div
            className={cx(
                classes.step,
                state === "active" && classes.stepActive,
                state === "complete" && classes.stepComplete
            )}
        >
            <span className={classes.stepBullet}>
                {state === "complete" ? "✓" : index}
            </span>
            <span className={classes.stepLabel}>{label}</span>
        </div>
    );
}

const useStyles = tss.withName({ HomeLS3GitDialog }).create(({ theme }) => ({
    root: {
        width: 640,
        maxWidth: "calc(100vw - 72px)",
        minHeight: 346,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4),
        "@media (max-width: 520px)": {
            maxWidth: "calc(100vw - 48px)"
        }
    },
    stepper: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        marginBottom: theme.spacing(1),
        "@media (max-width: 520px)": {
            alignItems: "flex-start",
            flexDirection: "column",
            gap: theme.spacing(1)
        }
    },
    step: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        color: theme.colors.useCases.typography.textSecondary,
        whiteSpace: "nowrap",
        "@media (max-width: 520px)": {
            whiteSpace: "normal"
        }
    },
    stepActive: {
        color: theme.colors.useCases.typography.textPrimary
    },
    stepComplete: {
        color: theme.colors.useCases.typography.textFocus
    },
    stepBullet: {
        width: 28,
        height: 28,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        border: `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        fontWeight: 700,
        fontSize: 13
    },
    stepLabel: {
        fontWeight: 600,
        fontSize: 14
    },
    stepDivider: {
        height: 1,
        flex: 1,
        minWidth: 32,
        backgroundColor: theme.colors.useCases.typography.textTertiary,
        "@media (max-width: 520px)": {
            display: "none"
        }
    },
    lead: {
        maxWidth: 600,
        overflowWrap: "anywhere"
    },
    note: {
        margin: 0,
        padding: `${theme.spacing(2.5)} ${theme.spacing(3)}`,
        borderLeft: `3px solid ${theme.colors.useCases.typography.textFocus}`,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        color: theme.colors.useCases.typography.textSecondary,
        lineHeight: 1.55,
        overflowWrap: "anywhere"
    },
    textField: {
        width: "100%"
    },
    actions: {
        display: "flex",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        marginTop: "auto",
        flexWrap: "wrap",
        "@media (max-width: 520px)": {
            flexDirection: "column",
            "& > button": {
                width: "100%"
            }
        }
    }
}));
