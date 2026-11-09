import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useState } from "react";
import { css } from "ui/theme/emotionCache";
import type { ConnectedProvider } from "core/usecases/gitProvidersManagement";
import type { DisconnectedProvider } from "core/usecases/gitAccountUiController";
import type { GitRepository } from "core/ports/GitProvider";
import type { FormField } from "core/usecases/launcher/decoupledLogic/formTypes";
import { GitRepositoryFormField } from "./GitRepositoryFormField";

const meta = {
    title: "pages/Launcher/GitRepositoryFormField",
    component: StoryWrapper
} satisfies Meta<typeof StoryWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChangeAction = action("onChange");

const connectedProviders: ConnectedProvider[] = [
    {
        providerId: "forgejo-oauth",
        displayName: "Forgejo",
        type: "forgejo",
        url: "https://forgejo.lab.sspcloud.fr",
        logoUrl: undefined
    },
    {
        providerId: "user:bitbucket.org",
        displayName: "bitbucket.org",
        type: "bitbucket",
        url: "https://bitbucket.org",
        logoUrl: undefined
    }
];

const provider_gitLab: DisconnectedProvider = {
    providerId: "gitlab-oauth",
    displayName: "GitLab SSPCloud",
    type: "gitlab",
    logoUrl: undefined,
    connectionMethod: "oauth",
    issue: "not connected",
    isSigningIn: false,
    error: undefined
};

const provider_gitHub: DisconnectedProvider = {
    providerId: "github",
    displayName: "GitHub",
    type: "github",
    logoUrl: undefined,
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

const recentRepositories = ["ddecrulle/test-git", "ddecrulle/onyxia-notes"].map(
    createRepository
);

// NOTE: Not on the first page, only found by asking the provider.
const olderRepositories = ["ddecrulle/test-archive", "ddecrulle/notes-2019"].map(
    createRepository
);

type Params = {
    isReadonly: boolean;
    connectedProviders: ConnectedProvider[] | undefined;
    disconnectedProviders: DisconnectedProvider[] | undefined;
    value: FormField.GitRepository["value"];
};

function StoryWrapper(params: Params) {
    const { isReadonly, connectedProviders, disconnectedProviders } = params;

    const [value, setValue] = useState(params.value);

    return (
        <GitRepositoryFormField
            className={css({ maxWidth: 800 })}
            title="Git repository"
            description="Cloned in the service"
            isReadonly={isReadonly}
            onRemove={action("onRemove")}
            value={value}
            onChange={value => {
                onChangeAction(value);
                setValue(value);
            }}
            connectedProviders={connectedProviders}
            disconnectedProviders={disconnectedProviders}
            onSignIn={action("onSignIn")}
            searchRepositories={async ({ search }) => {
                await new Promise(resolve => setTimeout(resolve, 800));

                const search_trimmed = search.trim();

                return search_trimmed === ""
                    ? { repositories: recentRepositories, hasNextPage: true }
                    : {
                          repositories: [
                              ...recentRepositories,
                              ...olderRepositories
                          ].filter(({ fullPath }) => fullPath.includes(search_trimmed)),
                          hasNextPage: false
                      };
            }}
            listBranches={async ({ search }) => {
                await new Promise(resolve => setTimeout(resolve, 300));

                return ["main", "dev", "feat/git-repositories", "fix/clone"].filter(
                    name => name.includes(search.trim())
                );
            }}
            getConnectedProviderIdOfRepositoryUrl={({ url }) =>
                connectedProviders?.find(provider =>
                    url.trim().startsWith(`${provider.url}/`)
                )?.providerId
            }
            accountGitHref="#"
        />
    );
}

export const Empty: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [],
        value: { providerId: "", url: "", branch: "" }
    }
};

export const Picked: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [],
        value: {
            providerId: "user:bitbucket.org",
            url: "https://bitbucket.org/ddecrulle/test-git.git",
            branch: "main"
        }
    }
};

export const ProviderNotConnected: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [],
        value: {
            providerId: "gitlab-oauth",
            url: "https://git.lab.sspcloud.fr/ddecrulle/test.git",
            branch: ""
        }
    }
};

export const NoProviderConnected: Story = {
    args: {
        isReadonly: false,
        connectedProviders: [],
        disconnectedProviders: [],
        value: { providerId: "", url: "", branch: "" }
    }
};

export const OtherProvidersToConnect: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [provider_gitLab, provider_gitHub],
        value: { providerId: "", url: "", branch: "" }
    }
};

export const NothingConnectedWithProvidersToConnect: Story = {
    args: {
        isReadonly: false,
        connectedProviders: [],
        disconnectedProviders: [provider_gitLab, provider_gitHub],
        value: { providerId: "", url: "", branch: "" }
    }
};

export const SessionExpired: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [{ ...provider_gitLab, issue: "session expired" }],
        value: { providerId: "", url: "", branch: "" }
    }
};

export const TokenRejected: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [
            { ...provider_gitHub, issue: "personal access token rejected" }
        ],
        value: { providerId: "", url: "", branch: "" }
    }
};

export const ProviderUnreachable: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [{ ...provider_gitLab, issue: "loading failed" }],
        value: { providerId: "", url: "", branch: "" }
    }
};

export const SignInPopupBlocked: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [{ ...provider_gitLab, error: { type: "popup blocked" } }],
        value: { providerId: "", url: "", branch: "" }
    }
};

export const RepositoryOnDisconnectedProvider: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [provider_gitLab],
        value: {
            providerId: "gitlab-oauth",
            url: "https://git.lab.sspcloud.fr/ddecrulle/test.git",
            branch: ""
        }
    }
};

export const UrlOnConnectedProvider: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [],
        value: {
            providerId: "",
            url: "https://forgejo.lab.sspcloud.fr/ddecrulle/test-forge.git",
            branch: ""
        }
    }
};

export const UrlAnonymous: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
        disconnectedProviders: [],
        value: {
            providerId: "",
            url: "https://github.com/pandas-dev/pandas.git",
            branch: ""
        }
    }
};

export const Readonly: Story = {
    args: {
        isReadonly: true,
        connectedProviders,
        disconnectedProviders: [],
        value: {
            providerId: "user:bitbucket.org",
            url: "https://bitbucket.org/ddecrulle/test-git.git",
            branch: "main"
        }
    }
};
