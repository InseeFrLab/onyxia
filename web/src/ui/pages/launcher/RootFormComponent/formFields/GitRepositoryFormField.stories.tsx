import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useState } from "react";
import { css } from "ui/theme/emotionCache";
import type { ConnectedProvider } from "core/usecases/gitProvidersManagement";
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
        logoUrl: undefined,
        isFavorite: true
    },
    {
        providerId: "user:bitbucket.org",
        displayName: "bitbucket.org",
        type: "bitbucket",
        url: "https://bitbucket.org",
        logoUrl: undefined,
        isFavorite: false
    }
];

const repositories: GitRepository[] = [
    "ddecrulle/test-git",
    "ddecrulle/onyxia-notes"
].map(fullPath => ({
    id: fullPath,
    name: fullPath.split("/")[1],
    fullPath,
    description: `The ${fullPath.split("/")[1]} repository`,
    webUrl: `https://bitbucket.org/${fullPath}`,
    httpCloneUrl: `https://bitbucket.org/${fullPath}.git`,
    defaultBranch: "main"
}));

type Params = {
    isReadonly: boolean;
    connectedProviders: ConnectedProvider[] | undefined;
    value: FormField.GitRepository["value"];
};

function StoryWrapper(params: Params) {
    const { isReadonly, connectedProviders } = params;

    const [value, setValue] = useState(params.value);

    return (
        <GitRepositoryFormField
            className={css({ width: 800 })}
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
            searchRepositories={async ({ search }) => {
                await new Promise(resolve => setTimeout(resolve, 400));

                return repositories.filter(({ fullPath }) =>
                    fullPath.includes(search.trim())
                );
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
        value: { providerId: "", url: "", branch: "" }
    }
};

export const Picked: Story = {
    args: {
        isReadonly: false,
        connectedProviders,
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
        value: { providerId: "", url: "", branch: "" }
    }
};
