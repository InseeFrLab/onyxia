import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import type { AccountView } from "core/usecases/gitAccountUiController";
import { OAuthAuthorizationError } from "core/ports/OAuthAuthorization";
import { GitProviderCard } from "./GitProviderCard";

const card_gitLab: AccountView.ProviderCard = {
    id: "git.lab.sspcloud.fr",
    displayName: "GitLab SSPCloud",
    type: "gitlab",
    url: "https://git.lab.sspcloud.fr",
    logoUrl: undefined,
    documentation: {
        mainText:
            "Use your SSPCloud GitLab account to clone and push from your services.",
        links: [{ label: "Documentation", url: "https://docs.sspcloud.fr" }]
    },
    isFavorite: true,
    connection: {
        status: "connected",
        user: { username: "jdoe", name: "Jane Doe", email: "jane@example.com" }
    },
    authentication: { type: "oauth", authorizedApplicationsUrl: undefined }
};

const card_gitHub: AccountView.ProviderCard = {
    id: "github.com",
    displayName: "GitHub",
    type: "github",
    url: "https://github.com",
    logoUrl: undefined,
    documentation: undefined,
    isFavorite: false,
    connection: { status: "not connected" },
    authentication: {
        type: "personal-access-token",
        personalAccessTokenCreationUrl:
            "https://github.com/settings/tokens/new?description=Onyxia&scopes=repo"
    }
};

const meta = {
    title: "Pages/Account/Git/GitProviderCard",
    component: GitProviderCard,
    decorators: [
        Story => (
            <div style={{ maxWidth: 560 }}>
                <Story />
            </div>
        )
    ],
    args: {
        card: card_gitLab,
        onSignIn: async () => action("sign in")(),
        onSignOut: async () => action("sign out")(),
        onSetPersonalAccessToken: async ({ personalAccessToken }) => {
            action("set personal access token")(personalAccessToken);
            return { isAccepted: personalAccessToken === "valid" };
        },
        onRemovePersonalAccessToken: async () => action("remove token")(),
        onSetFavorite: action("set favorite")
    }
} satisfies Meta<typeof GitProviderCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OAuthConnected: Story = {};

export const OAuthNotConnected: Story = {
    args: {
        card: {
            ...card_gitLab,
            isFavorite: false,
            connection: { status: "not connected" }
        }
    }
};

export const OAuthPopupBlocked: Story = {
    args: {
        card: { ...card_gitLab, connection: { status: "not connected" } },
        onSignIn: async () => {
            throw new OAuthAuthorizationError("popup blocked", "blocked");
        }
    }
};

export const OAuthSessionExpired: Story = {
    args: {
        card: {
            ...card_gitLab,
            connection: { status: "error", reason: "session expired" }
        }
    }
};

export const OAuthWithoutRevocation: Story = {
    args: {
        card: {
            ...card_gitLab,
            id: "forgejo.lab.sspcloud.fr",
            displayName: "Forgejo",
            type: "forgejo",
            url: "https://forgejo.lab.sspcloud.fr",
            documentation: undefined,
            authentication: {
                type: "oauth",
                authorizedApplicationsUrl:
                    "https://forgejo.lab.sspcloud.fr/user/settings/applications"
            }
        }
    }
};

export const Connecting: Story = {
    args: { card: { ...card_gitLab, connection: { status: "connecting" } } }
};

export const PersonalAccessTokenNotConnected: Story = {
    args: { card: card_gitHub }
};

export const PersonalAccessTokenConnected: Story = {
    args: {
        card: {
            ...card_gitHub,
            connection: {
                status: "connected",
                user: { username: "jdoe-gh", name: "Jane", email: undefined }
            }
        }
    }
};

export const PersonalAccessTokenRejected: Story = {
    args: {
        card: {
            ...card_gitHub,
            connection: { status: "error", reason: "personal access token rejected" }
        }
    }
};
