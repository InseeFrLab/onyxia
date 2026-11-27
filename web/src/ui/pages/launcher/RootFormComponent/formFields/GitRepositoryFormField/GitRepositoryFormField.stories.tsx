import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useState } from "react";
import { css } from "ui/theme/emotionCache";
import type { ConnectedForge } from "core/usecases/gitForgesManagement";
import type { DisconnectedForge } from "core/usecases/gitAccountUiController";
import type { GitRepository } from "core/ports/GitForge";
import { updateRepositorySearchCache } from "core/usecases/gitForgesManagement/decoupledLogic/repositorySearch";
import {
    computeField,
    createFieldState,
    emptyValue,
    getRepositorySearchCacheKey,
    getValueOfUrlInput,
    type FieldState,
    type Value
} from "core/usecases/gitRepositoryFieldUiController/decoupledLogic";
import { GitRepositoryFormField } from "./GitRepositoryFormField";

const meta = {
    title: "pages/Launcher/GitRepositoryFormField",
    component: StoryWrapper
} satisfies Meta<typeof StoryWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChangeAction = action("onChange");

const connectedForges: ConnectedForge[] = [
    {
        forgeId: "forgejo-oauth",
        displayName: "Forgejo",
        type: "forgejo",
        url: "https://forgejo.lab.sspcloud.fr",
        logoUrl: undefined,
        username: "boby.thestatistician"
    },
    {
        forgeId: "user:bitbucket.org",
        displayName: "bitbucket.org",
        type: "bitbucket",
        url: "https://bitbucket.org",
        logoUrl: undefined,
        username: "boby"
    }
];

const forge_gitLab: DisconnectedForge = {
    forgeId: "gitlab-oauth",
    displayName: "GitLab SSPCloud",
    type: "gitlab",
    logoUrl: undefined,
    isAddedByUser: false,
    connectionMethod: "oauth",
    issue: "not connected",
    isSigningIn: false,
    error: undefined
};

const forge_gitHub: DisconnectedForge = {
    forgeId: "github",
    displayName: "GitHub",
    type: "github",
    logoUrl: undefined,
    isAddedByUser: true,
    connectionMethod: "personal-access-token",
    issue: "not connected",
    isSigningIn: false,
    error: undefined
};

const createRepository = (fullPath: string): GitRepository => ({
    id: fullPath,
    name: fullPath.split("/")[1],
    fullPath,
    description: `The ${fullPath.split("/")[1]} repository`,
    webUrl: `https://bitbucket.org/${fullPath}`,
    httpCloneUrl: `https://bitbucket.org/${fullPath}.git`,
    defaultBranch: "main"
});

// NOTE: More than the list shows at once, to see it scroll.
const recentRepositories = [
    "ddecrulle/test-git",
    "ddecrulle/onyxia-notes",
    "ddecrulle/helm-charts",
    "ddecrulle/datalab-docs",
    "ddecrulle/sandbox",
    "ddecrulle/dotfiles",
    "ddecrulle/training-python"
].map(createRepository);

const branches = ["main", "dev", "feat/git-repositories", "fix/clone"];

type Params = {
    isReadonly: boolean;
    connectedForges: ConnectedForge[] | undefined;
    disconnectedForges: DisconnectedForge[] | undefined;
    value: Value;
};

/**
 * The view as gitRepositoryFieldUiController computes it, from a local state: the
 * first page of the recent repositories is known, the branches are always the same.
 */
function StoryWrapper(params: Params) {
    const { isReadonly, connectedForges, disconnectedForges } = params;

    const [value, setValue] = useState(params.value);
    const [fieldState, setFieldState] = useState(() =>
        createFieldState({ helmValuesPath: ["git"], isReadonly, value: params.value })
    );

    const changeValue = (value: Value) => {
        onChangeAction(value);
        setValue(value);
    };

    const updateFieldState = (fieldState_partial: Partial<FieldState>) =>
        setFieldState(fieldState => ({ ...fieldState, ...fieldState_partial }));

    const { view, forgeId } = computeField({
        fieldState: {
            ...fieldState,
            branches:
                value.url === ""
                    ? { status: "idle" }
                    : {
                          status: "loaded",
                          branches: branches.filter(name =>
                              name.includes(fieldState.branchSearch.trim())
                          )
                      }
        },
        value,
        connectedForges,
        disconnectedForges,
        repositorySearchCacheByKey: Object.fromEntries(
            (connectedForges ?? []).map(({ forgeId, username }) => [
                getRepositorySearchCacheKey({ forgeId, username }),
                updateRepositorySearchCache({
                    cache: undefined,
                    search: "",
                    page: 1,
                    repositories: recentRepositories,
                    hasNextPage: false
                })
            ])
        )
    });

    const changeUrlInput = (urlInput: string) => {
        updateFieldState({ urlInput, mode_selected: "url" });

        const value_new = getValueOfUrlInput({ urlInput, value, connectedForges });

        if (value_new !== undefined) {
            changeValue(value_new);
        }
    };

    return (
        <GitRepositoryFormField
            className={css({ maxWidth: 800 })}
            title="Git repository"
            description="Cloned in the service"
            onRemove={action("onRemove")}
            view={view}
            accountGitHref="#"
            onModeChange={mode =>
                updateFieldState({
                    mode_selected: mode,
                    ...(mode === "url" ? { urlInput: value.url } : {})
                })
            }
            onForgeSelect={forgeId => {
                updateFieldState({ forgeId_selected: forgeId, search: "" });

                if (value.url !== "" && forgeId !== value.forgeId) {
                    changeValue(emptyValue);
                }
            }}
            onSearchChange={search =>
                /^https?:\/\//.test(search.trim())
                    ? changeUrlInput(search)
                    : updateFieldState({ search })
            }
            onPickedRepositoryEdit={search => {
                changeValue(emptyValue);
                updateFieldState({ search });
            }}
            onRepositoryClear={() => {
                updateFieldState({ search: "" });
                changeValue(emptyValue);
            }}
            onRepositoryPick={repository => {
                if (forgeId === undefined) {
                    return;
                }

                updateFieldState({ search: "" });
                changeValue({
                    forgeId,
                    url: repository.httpCloneUrl,
                    branch: repository.defaultBranch ?? ""
                });
            }}
            onMoreRepositoriesRequest={action("onMoreRepositoriesRequest")}
            onUrlInputChange={changeUrlInput}
            onBranchChange={branch => changeValue({ ...value, branch })}
            onBranchSearchChange={branchSearch => updateFieldState({ branchSearch })}
            onSignIn={action("onSignIn")}
            onManage={action("onManage")}
        />
    );
}

export const Empty: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [],
        value: { forgeId: "", url: "", branch: "" }
    }
};

export const Picked: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [],
        value: {
            forgeId: "user:bitbucket.org",
            url: "https://bitbucket.org/ddecrulle/test-git.git",
            branch: "main"
        }
    }
};

export const ForgeNotConnected: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [],
        value: {
            forgeId: "gitlab-oauth",
            url: "https://git.lab.sspcloud.fr/ddecrulle/test.git",
            branch: ""
        }
    }
};

export const NoForgeConnected: Story = {
    args: {
        isReadonly: false,
        connectedForges: [],
        disconnectedForges: [],
        value: { forgeId: "", url: "", branch: "" }
    }
};

export const OtherForgesToConnect: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [forge_gitLab, forge_gitHub],
        value: { forgeId: "", url: "", branch: "" }
    }
};

export const NothingConnectedWithForgesToConnect: Story = {
    args: {
        isReadonly: false,
        connectedForges: [],
        disconnectedForges: [forge_gitLab, forge_gitHub],
        value: { forgeId: "", url: "", branch: "" }
    }
};

export const SessionExpired: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [{ ...forge_gitLab, issue: "session expired" }],
        value: { forgeId: "", url: "", branch: "" }
    }
};

export const TokenRejected: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [
            { ...forge_gitHub, issue: "personal access token rejected" }
        ],
        value: { forgeId: "", url: "", branch: "" }
    }
};

export const ForgeUnreachable: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [{ ...forge_gitLab, issue: "loading failed" }],
        value: { forgeId: "", url: "", branch: "" }
    }
};

export const SignInPopupBlocked: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [{ ...forge_gitLab, error: { type: "popup blocked" } }],
        value: { forgeId: "", url: "", branch: "" }
    }
};

export const RepositoryOnDisconnectedForge: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [forge_gitLab],
        value: {
            forgeId: "gitlab-oauth",
            url: "https://git.lab.sspcloud.fr/ddecrulle/test.git",
            branch: ""
        }
    }
};

export const UrlOnConnectedForge: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [],
        value: {
            forgeId: "",
            url: "https://forgejo.lab.sspcloud.fr/ddecrulle/test-forge.git",
            branch: ""
        }
    }
};

export const UrlAnonymous: Story = {
    args: {
        isReadonly: false,
        connectedForges,
        disconnectedForges: [],
        value: {
            forgeId: "",
            url: "https://github.com/pandas-dev/pandas.git",
            branch: ""
        }
    }
};

export const Readonly: Story = {
    args: {
        isReadonly: true,
        connectedForges,
        disconnectedForges: [],
        value: {
            forgeId: "user:bitbucket.org",
            url: "https://bitbucket.org/ddecrulle/test-git.git",
            branch: "main"
        }
    }
};
