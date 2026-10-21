import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import type { AccountView } from "core/usecases/gitAccountUiController";
import { GitProviderCard } from "./GitProviderCard";

const user = { username: "jdoe", name: "Jane Doe", email: "jane@example.com" };

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
    status: "connected",
    message: { type: "connected as", user },
    gitIdentity: { name: user.name, email: user.email, isUsedAtLaunch: true },
    favorite: "is favorite",
    error: undefined,
    authorizedApplications: undefined,
    pendingAction: undefined,
    authentication: { type: "oauth", signIn: undefined, isDisabled: false }
};

const card_gitLab_notConnected: AccountView.ProviderCard = {
    ...card_gitLab,
    status: "setup required",
    message: { type: "not connected" },
    gitIdentity: undefined,
    favorite: "can be set as favorite",
    authentication: { type: "oauth", signIn: { label: "sign in" }, isDisabled: false }
};

const card_forgejo_notConnected: AccountView.ProviderCard = {
    ...card_gitLab_notConnected,
    id: "forgejo.lab.sspcloud.fr",
    displayName: "Forgejo",
    type: "forgejo",
    url: "https://forgejo.lab.sspcloud.fr",
    documentation: undefined
};

const authorizedApplicationsUrl =
    "https://forgejo.lab.sspcloud.fr/user/settings/applications";

const card_gitHub: AccountView.ProviderCard = {
    id: "github.com",
    displayName: "GitHub",
    type: "github",
    url: "https://github.com",
    logoUrl: undefined,
    documentation: undefined,
    status: "setup required",
    message: { type: "not connected" },
    gitIdentity: undefined,
    favorite: "can be set as favorite",
    error: undefined,
    authorizedApplications: undefined,
    pendingAction: undefined,
    authentication: {
        type: "personal-access-token",
        personalAccessTokenCreationUrl:
            "https://github.com/settings/tokens/new?description=Onyxia&scopes=repo",
        isFormShown: true,
        isReplaceButtonShown: false,
        isCancelButtonShown: false,
        isRemoveButtonShown: false,
        isDisabled: false
    }
};

const card_gitHub_connected: AccountView.ProviderCard = {
    ...card_gitHub,
    status: "connected",
    message: {
        type: "connected as",
        user: { username: "jdoe-gh", name: "Jane", email: undefined }
    },
    gitIdentity: { name: "Jane", email: undefined, isUsedAtLaunch: false },
    authentication: {
        ...card_gitHub.authentication,
        type: "personal-access-token",
        personalAccessTokenCreationUrl:
            "https://github.com/settings/tokens/new?description=Onyxia&scopes=repo",
        isFormShown: false,
        isReplaceButtonShown: true,
        isCancelButtonShown: false,
        isRemoveButtonShown: true,
        isDisabled: false
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
        onSignIn: action("sign in"),
        onSignOut: action("sign out"),
        onSetPersonalAccessToken: action("set personal access token"),
        onStartReplacingPersonalAccessToken: action("start replacing token"),
        onCancelReplacingPersonalAccessToken: action("cancel replacing token"),
        onRemovePersonalAccessToken: action("remove token"),
        onSetFavorite: action("set favorite")
    }
} satisfies Meta<typeof GitProviderCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OAuthConnected: Story = {};

export const OAuthNotConnected: Story = {
    args: { card: card_gitLab_notConnected }
};

export const OAuthSigningIn: Story = {
    args: {
        card: {
            ...card_gitLab_notConnected,
            status: "connecting",
            message: undefined,
            pendingAction: "sign in",
            authentication: {
                type: "oauth",
                signIn: { label: "sign in" },
                isDisabled: true
            }
        }
    }
};

export const OAuthPopupBlocked: Story = {
    args: {
        card: { ...card_gitLab_notConnected, error: { type: "popup blocked" } }
    }
};

export const OAuthDenied: Story = {
    args: {
        card: {
            ...card_gitLab_notConnected,
            error: { type: "sign in denied", providerError: "access_denied" }
        }
    }
};

export const OAuthSessionExpired: Story = {
    args: {
        card: {
            ...card_gitLab_notConnected,
            status: "connection error",
            message: { type: "error", reason: "session expired" },
            authentication: {
                type: "oauth",
                signIn: { label: "sign in again" },
                isDisabled: false
            }
        }
    }
};

export const OAuthSignedOutWithoutRevocation: Story = {
    args: {
        card: {
            ...card_forgejo_notConnected,
            authorizedApplications: {
                url: authorizedApplicationsUrl,
                reason: "signed out without revocation"
            }
        }
    }
};

export const OAuthGrantScopeConflict: Story = {
    args: {
        card: {
            ...card_forgejo_notConnected,
            error: { type: "grant scope conflict" },
            authorizedApplications: {
                url: authorizedApplicationsUrl,
                reason: "grant scope conflict"
            }
        }
    }
};

export const PersonalAccessTokenNotConnected: Story = {
    args: { card: card_gitHub }
};

export const PersonalAccessTokenRejected: Story = {
    args: {
        card: { ...card_gitHub, error: { type: "personal access token rejected" } }
    }
};

export const PersonalAccessTokenConnected: Story = {
    args: { card: card_gitHub_connected }
};

export const PersonalAccessTokenReplacing: Story = {
    args: {
        card: {
            ...card_gitHub_connected,
            authentication: {
                ...card_gitHub_connected.authentication,
                type: "personal-access-token",
                personalAccessTokenCreationUrl:
                    "https://github.com/settings/tokens/new?description=Onyxia&scopes=repo",
                isFormShown: true,
                isReplaceButtonShown: false,
                isCancelButtonShown: true,
                isRemoveButtonShown: false,
                isDisabled: false
            }
        }
    }
};

export const PersonalAccessTokenNoLongerAccepted: Story = {
    args: {
        card: {
            ...card_gitHub,
            status: "connection error",
            message: { type: "error", reason: "personal access token rejected" },
            authentication: {
                ...card_gitHub.authentication,
                type: "personal-access-token",
                personalAccessTokenCreationUrl:
                    "https://github.com/settings/tokens/new?description=Onyxia&scopes=repo",
                isFormShown: true,
                isReplaceButtonShown: false,
                isCancelButtonShown: false,
                isRemoveButtonShown: true,
                isDisabled: false
            }
        }
    }
};
