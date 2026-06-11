import { memo, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { assert, id } from "tsafe";
import { Evt, type UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { createUseGlobalState } from "powerhooks/useGlobalState";
import { useCoreState, getCoreSync } from "core";
import { TextField, type TextFieldProps } from "onyxia-ui/TextField";
import { useConst } from "powerhooks/useConst";
import Link from "@mui/material/Link";
import { PUBLIC_URL } from "env";
import { useStyles } from "tss";

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
            title="Projet GitLab (Optionel)"
            isOpen={state !== undefined}
            maxWidth={"xl"}
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

function Body(props: {
    serviceName: string;
    onProceed: (params: { gitlabRepoUrl: string | undefined }) => void;
}) {
    const { serviceName, onProceed } = props;

    const { githubPersonalAccessToken } = useCoreState("userConfigs", "userConfigs");
    const {
        functions: { userConfigs }
    } = getCoreSync();

    const evtTextFieldAction = useConst(() =>
        Evt.create<UnpackEvt<TextFieldProps["evtAction"]>>()
    );

    const [isValidateTokenDisabled, setIsValidateTokenDisabled] = useState(true);

    const { gitlabRepoUrl, setGitlabRepoUrl } = useGitlabRepoUrl();

    const doInjectGitUrl = !!githubPersonalAccessToken && !!gitlabRepoUrl;

    const { css, theme } = useStyles();

    return (
        <div>
            {!githubPersonalAccessToken ? (
                <div>
                    <TextField
                        label="GitLab Personal Access Token"
                        className={css({
                            width: 1000
                        })}
                        defaultValue="glpat-AAAAAAAAAAAAAAAAAAAA"
                        helperText={
                            <>
                                Votre jetton d'accès personnel GitLab qui permetra de
                                recuperer le code de votre projet dans vos services. Pour
                                savoir comment l'obtenir, voir{" "}
                                <Link
                                    target="_blank"
                                    href={`${PUBLIC_URL}custom-resources-example/ls3/how-to-get-my-gitlab-token.md`}
                                >
                                    ce guide
                                </Link>
                            </>
                        }
                        selectAllTextOnFocus
                        doOnlyShowErrorAfterFirstFocusLost={false}
                        evtAction={evtTextFieldAction}
                        onSubmit={token => {
                            userConfigs.changeValue({
                                key: "githubPersonalAccessToken",
                                value: token
                            });
                        }}
                        getIsValidValue={token => {
                            if (!GITLAB_TOKEN_REGEXP.test(token)) {
                                return {
                                    isValidValue: false,
                                    message: (
                                        <>
                                            Un Token GitLab doit être de la forme
                                            gplat-xxx
                                        </>
                                    )
                                };
                            }

                            return {
                                isValidValue: true
                            };
                        }}
                        onValueBeingTypedChange={params => {
                            setIsValidateTokenDisabled(!params.isValidValue);
                        }}
                    />
                    <Button
                        onClick={() => evtTextFieldAction.post("TRIGGER SUBMIT")}
                        disabled={isValidateTokenDisabled}
                        className={css({
                            marginTop: theme.spacing(6)
                        })}
                    >
                        Valider
                    </Button>
                </div>
            ) : (
                <>
                    <TextField
                        label="URL du dépot GitLab"
                        helperText={<>URL du repo gitlab a cloner dans le service</>}
                        doOnlyShowErrorAfterFirstFocusLost={false}
                        defaultValue={gitlabRepoUrl ?? ""}
                        evtAction={evtTextFieldAction}
                        getIsValidValue={token => {
                            if (token !== "" && !GITLAB_REPO_REGEXP.test(token)) {
                                return {
                                    isValidValue: false,
                                    message: <>Pas un url GitLab valide</>
                                };
                            }

                            return {
                                isValidValue: true
                            };
                        }}
                        onValueBeingTypedChange={params => {
                            setIsValidateTokenDisabled(!params.isValidValue);
                            if (params.isValidValue) {
                                setGitlabRepoUrl(params.value);
                            }
                        }}
                    />
                </>
            )}
            <Button
                onClick={() => {
                    onProceed({
                        gitlabRepoUrl: doInjectGitUrl ? gitlabRepoUrl : undefined
                    });
                }}
                variant={doInjectGitUrl ? "primary" : "secondary"}
            >
                {!doInjectGitUrl ? `Passer l'etape` : `Lancer un ${serviceName}`}
            </Button>
        </div>
    );
}
