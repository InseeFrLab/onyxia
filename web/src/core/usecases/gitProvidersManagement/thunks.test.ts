import { beforeEach, expect, it, vi, describe } from "vitest";
import { createCore, createUsecaseActions } from "clean-architecture";
import type { Context } from "core/bootstrap";
import {
    GitProviderUnauthorizedError,
    type GitProvider,
    type GitUser
} from "core/ports/GitProvider";
import { OAuthAuthorizationError } from "core/ports/OAuthAuthorization";
import type { GitSessionStore } from "core/ports/GitSessionStore";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import { assert } from "tsafe/assert";

const mocks = vi.hoisted(() => ({
    context: undefined as unknown,
    save: vi.fn()
}));

vi.mock("core/rootContext", () => ({ getRootContext: () => mocks.context }));

// NOTE: Kept out of vi.resetModules() (mocks registry), so that the errors thrown by the
// fakes are instances of the classes the reloaded usecase checks against.
vi.mock("core/ports/GitProvider", async importOriginal => await importOriginal());
vi.mock("core/ports/OAuthAuthorization", async importOriginal => await importOriginal());

vi.mock("core/usecases/userConfigs", () => ({
    selectors: {
        userConfigs: (state: { userConfigs: Record<string, unknown> }) =>
            state.userConfigs
    },
    thunks: {
        changeValue:
            ({ key, value }: { key: string; value: string }) =>
            async (dispatch: (action: unknown) => void) => {
                await mocks.save({ key, value });
                dispatch({ type: "userConfigs/valueChanged", payload: { key, value } });
            }
    }
}));

const user_gitLab: GitUser = { username: "jdoe", name: "J. Doe", email: "j@lab" };
const user_gitHub: GitUser = { username: "jdoe-gh", name: "Jane", email: undefined };

function createFakeOAuthProvider(params: { id: string; withRevoke: boolean }) {
    const calls = {
        refresh: vi.fn<(refreshToken: string) => void>(),
        revoke: vi.fn<(refreshToken: string) => void>(),
        getUser: vi.fn<(accessToken: string) => void>()
    };

    const behavior = {
        isRefreshRejected: false,
        rejectedAccessTokens: new Set<string>()
    };

    let refreshCount = 0;

    const gitProvider: GitProvider = {
        id: params.id,
        displayName: params.id,
        url: `https://${params.id}`,
        ui: {
            type: "oauth",
            oauth: {
                getAuthorizationUrl: ({ state }) =>
                    `https://${params.id}/authorize?${state}`,
                exchangeAuthorizationCode: async ({ code }) => ({
                    accessToken: `access-from-${code}`,
                    refreshToken: `refresh-from-${code}`,
                    expirationTime: Date.now() + 3600_000
                }),
                refreshTokens: async ({ refreshToken }) => {
                    calls.refresh(refreshToken);
                    if (behavior.isRefreshRejected) {
                        throw new GitProviderUnauthorizedError();
                    }
                    refreshCount++;
                    return {
                        accessToken: `access-${refreshCount}`,
                        refreshToken: `refresh-${refreshCount}`,
                        expirationTime: Date.now() + 3600_000
                    };
                },
                revokeTokens: params.withRevoke
                    ? async ({ refreshToken }) => calls.revoke(refreshToken)
                    : undefined,
                authorizedApplicationsUrl: `https://${params.id}/applications`
            }
        },
        service: { type: "personal-access-token" },
        getUser: async ({ accessToken }) => {
            calls.getUser(accessToken);
            if (behavior.rejectedAccessTokens.has(accessToken)) {
                throw new GitProviderUnauthorizedError();
            }
            return user_gitLab;
        },
        listRepositories: async ({ accessToken }) => {
            if (behavior.rejectedAccessTokens.has(accessToken)) {
                throw new GitProviderUnauthorizedError();
            }
            return { repositories: [], hasNextPage: false };
        }
    };

    return { gitProvider, calls, behavior };
}

function createFakePatProvider(params: { id: string; validToken: string }) {
    const gitProvider: GitProvider = {
        id: params.id,
        displayName: params.id,
        url: "https://github.com",
        ui: {
            type: "personal-access-token",
            personalAccessTokenCreationUrl: "https://github.com/settings/tokens/new"
        },
        service: { type: "personal-access-token" },
        getUser: async ({ accessToken }) => {
            if (accessToken !== params.validToken) {
                throw new GitProviderUnauthorizedError();
            }
            return user_gitHub;
        },
        listRepositories: async () => ({ repositories: [], hasNextPage: false })
    };

    return { gitProvider };
}

function createMemorySessionStore(initial: Record<string, string>) {
    const refreshTokenByProviderId = new Map(Object.entries(initial));

    const gitSessionStore: GitSessionStore = {
        get: ({ providerId }) => {
            const refreshToken = refreshTokenByProviderId.get(providerId);
            return refreshToken === undefined ? undefined : { refreshToken };
        },
        set: ({ providerId, refreshToken }) =>
            refreshTokenByProviderId.set(providerId, refreshToken),
        remove: ({ providerId }) => refreshTokenByProviderId.delete(providerId),
        runExclusive: ({ callback }) => callback()
    };

    return { gitSessionStore, refreshTokenByProviderId };
}

const toConfig = (
    gitProvider: GitProvider,
    type: GitProvidersConfig.ProviderType
): GitProvidersConfig.Provider => ({
    id: gitProvider.id,
    type,
    url: gitProvider.url,
    displayName: gitProvider.displayName,
    logoUrl: undefined,
    documentation: undefined,
    authentication: {
        ui:
            gitProvider.ui.type === "oauth"
                ? { type: "oauth", clientId: "x" }
                : { type: "personal-access-token" },
        service: { type: "personal-access-token" }
    }
});

/** The usecase keeps its access tokens at module level: fresh modules for each test */
async function setup(params?: {
    gitConfigStr?: string | null;
    githubPersonalAccessToken?: string | null;
    sessions?: Record<string, string>;
    authorizeInPopup?: () => Promise<{ code: string; codeVerifier: string }>;
}) {
    const {
        gitConfigStr = null,
        githubPersonalAccessToken = null,
        sessions = {},
        authorizeInPopup = async () => ({ code: "the-code", codeVerifier: "v" })
    } = params ?? {};

    const userConfigs = {
        thunks: {},
        selectors: {},
        ...createUsecaseActions({
            name: "userConfigs",
            initialState: {
                gitConfigStr,
                githubPersonalAccessToken
            } as Record<string, string | null>,
            reducers: {
                valueChanged: (
                    state,
                    { payload }: { payload: { key: string; value: string } }
                ) => {
                    state[payload.key] = payload.value;
                }
            }
        })
    };

    const gitLab = createFakeOAuthProvider({ id: "gitlab", withRevoke: true });
    const forgejo = createFakeOAuthProvider({ id: "forgejo", withRevoke: false });
    const gitHub = createFakePatProvider({ id: "github", validToken: "ghp_valid" });

    const { gitSessionStore, refreshTokenByProviderId } =
        createMemorySessionStore(sessions);

    const authorizeInPopupSpy = vi.fn(authorizeInPopup);

    const gitProviders = [gitLab.gitProvider, forgejo.gitProvider, gitHub.gitProvider];

    const context = {
        oidc: { isUserLoggedIn: true },
        gitProvidersConfig: {
            description: undefined,
            providers: [
                toConfig(gitLab.gitProvider, "gitlab"),
                toConfig(forgejo.gitProvider, "forgejo"),
                toConfig(gitHub.gitProvider, "github")
            ]
        },
        gitProviders,
        oauthAuthorization: {
            redirectUri: "https://onyxia/git/oauth/callback",
            authorizeInPopup: authorizeInPopupSpy
        },
        gitSessionStore
    } as unknown as Context;

    mocks.context = context;

    const management = await import("./index");
    const account = await import("../gitAccountUiController");

    const { core, dispatch, getState } = createCore({
        context,
        usecases: {
            gitProvidersManagement: management,
            gitAccountUiController: account,
            userConfigs
        }
    });

    const getConnection = (providerId: string) =>
        management.selectors
            .connections(getState() as never)
            ?.find(entry => entry.providerId === providerId)?.connection;

    const getPersisted = () => {
        const { gitConfigStr } = (getState() as never as { userConfigs: any })
            .userConfigs;
        return gitConfigStr === null ? null : JSON.parse(gitConfigStr);
    };

    const getView = () => {
        const view = core.states.gitAccountUiController.getMain();
        assert(view.isReady);
        return view;
    };

    return {
        core,
        dispatch,
        getState,
        gitLab,
        forgejo,
        refreshTokenByProviderId,
        authorizeInPopupSpy,
        getConnection,
        getPersisted,
        getView
    };
}

beforeEach(() => {
    mocks.save.mockReset();
    vi.resetModules();
});

describe("gitProvidersManagement", () => {
    it("migrates the former GitHub token once and checks it", async () => {
        const { core, getConnection, getPersisted, getView } = await setup({
            githubPersonalAccessToken: "ghp_valid"
        });

        await core.functions.gitAccountUiController.load();

        expect(getPersisted()).toStrictEqual({
            personalAccessTokenByProviderId: { github: "ghp_valid" },
            favoriteProviderId: null
        });
        expect(getConnection("github")).toStrictEqual({
            status: "connected",
            user: user_gitHub
        });
        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });
        // The first connected provider stands in for the favorite
        expect(getView().favoriteProviderId).toBe("github");
        expect(getView().identityPlaceholder).toStrictEqual(user_gitHub);
    });

    it("doesn't migrate again once gitConfigStr exists", async () => {
        const { core, getPersisted } = await setup({
            githubPersonalAccessToken: "ghp_valid",
            gitConfigStr: JSON.stringify({
                personalAccessTokenByProviderId: {},
                favoriteProviderId: null
            })
        });

        await core.functions.gitAccountUiController.load();

        expect(getPersisted().personalAccessTokenByProviderId).toStrictEqual({});
        expect(mocks.save).not.toHaveBeenCalled();
    });

    it("reports a stored config it can't read back", async () => {
        const { core } = await setup({ gitConfigStr: "not json" });

        await core.functions.gitAccountUiController.load();

        expect(core.states.gitAccountUiController.getMain()).toStrictEqual({
            isReady: false,
            stateDescription: "unreadable config"
        });

        await core.functions.gitAccountUiController.resetConfig();

        expect(core.states.gitAccountUiController.getMain().isReady).toBe(true);
    });

    it("loads once when asked concurrently", async () => {
        const { core, gitLab } = await setup({ sessions: { gitlab: "refresh-0" } });

        await Promise.all([
            core.functions.gitAccountUiController.load(),
            core.functions.gitProvidersManagement.load()
        ]);

        expect(gitLab.calls.refresh).toHaveBeenCalledTimes(1);
    });

    it("restores an OAuth session and rotates the refresh token", async () => {
        const { core, gitLab, refreshTokenByProviderId, getConnection } = await setup({
            sessions: { gitlab: "refresh-0" }
        });

        await core.functions.gitProvidersManagement.load();

        expect(gitLab.calls.refresh).toHaveBeenCalledWith("refresh-0");
        expect(refreshTokenByProviderId.get("gitlab")).toBe("refresh-1");
        expect(getConnection("gitlab")).toStrictEqual({
            status: "connected",
            user: user_gitLab
        });
    });

    it("expires the session when the refresh token is rejected", async () => {
        const { core, gitLab, refreshTokenByProviderId, getConnection } = await setup({
            sessions: { gitlab: "refresh-0" }
        });

        gitLab.behavior.isRefreshRejected = true;

        await core.functions.gitProvidersManagement.load();

        expect(getConnection("gitlab")).toStrictEqual({
            status: "error",
            reason: "session expired"
        });
        expect(refreshTokenByProviderId.has("gitlab")).toBe(false);
    });

    it("refreshes on 401 and retries once", async () => {
        const { core, gitLab } = await setup({ sessions: { gitlab: "refresh-0" } });

        await core.functions.gitProvidersManagement.load();

        // The access token got revoked on the provider in the meantime
        gitLab.behavior.rejectedAccessTokens.add("access-1");

        await core.functions.gitProvidersManagement.listRepositories({
            providerId: "gitlab",
            search: "",
            page: 1
        });

        expect(gitLab.calls.refresh).toHaveBeenCalledTimes(2);
        expect(
            await core.functions.gitProvidersManagement.getAccessToken({
                providerId: "gitlab"
            })
        ).toBe("access-2");
    });

    it("signs in with the popup", async () => {
        const { core, refreshTokenByProviderId, getConnection, authorizeInPopupSpy } =
            await setup();

        await core.functions.gitProvidersManagement.load();

        const prSignIn = core.functions.gitAccountUiController.signIn({
            providerId: "gitlab"
        });

        // NOTE: Synchronously, so that the browser doesn't block the popup.
        expect(authorizeInPopupSpy).toHaveBeenCalledTimes(1);
        expect(getConnection("gitlab")).toStrictEqual({ status: "connecting" });

        await prSignIn;

        expect(refreshTokenByProviderId.get("gitlab")).toBe("refresh-from-the-code");
        expect(getConnection("gitlab")).toStrictEqual({
            status: "connected",
            user: user_gitLab
        });
    });

    it("rejects explicitly when the popup is blocked, and leaves the card as it was", async () => {
        const { core, getConnection } = await setup({
            authorizeInPopup: () =>
                Promise.reject(new OAuthAuthorizationError("popup blocked", "blocked"))
        });

        await core.functions.gitProvidersManagement.load();

        await expect(
            core.functions.gitAccountUiController.signIn({ providerId: "gitlab" })
        ).rejects.toMatchObject({ reason: "popup blocked" });

        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });
    });

    it("revokes on sign out when the provider supports it", async () => {
        const { core, gitLab, refreshTokenByProviderId, getConnection, getView } =
            await setup({ sessions: { gitlab: "refresh-0", forgejo: "refresh-0" } });

        await core.functions.gitProvidersManagement.load();

        await core.functions.gitAccountUiController.signOut({ providerId: "gitlab" });

        expect(gitLab.calls.revoke).toHaveBeenCalledWith("refresh-1");
        expect(refreshTokenByProviderId.has("gitlab")).toBe(false);
        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });

        const forgejoCard = getView().providerCards.find(({ id }) => id === "forgejo");

        assert(forgejoCard?.authentication.type === "oauth");
        expect(forgejoCard.authentication.authorizedApplicationsUrl).toBe(
            "https://forgejo/applications"
        );
    });

    it("saves a PAT only once the provider accepted it", async () => {
        const { core, getConnection, getPersisted } = await setup();

        await core.functions.gitProvidersManagement.load();

        expect(
            await core.functions.gitAccountUiController.setPersonalAccessToken({
                providerId: "github",
                personalAccessToken: "ghp_wrong"
            })
        ).toStrictEqual({ isAccepted: false });
        expect(getPersisted()).toBe(null);

        expect(
            await core.functions.gitAccountUiController.setPersonalAccessToken({
                providerId: "github",
                personalAccessToken: " ghp_valid "
            })
        ).toStrictEqual({ isAccepted: true });
        expect(getPersisted().personalAccessTokenByProviderId).toStrictEqual({
            github: "ghp_valid"
        });
        expect(getConnection("github")).toStrictEqual({
            status: "connected",
            user: user_gitHub
        });

        await core.functions.gitAccountUiController.removePersonalAccessToken({
            providerId: "github"
        });

        expect(getPersisted().personalAccessTokenByProviderId).toStrictEqual({});
        expect(getConnection("github")).toStrictEqual({ status: "not connected" });
    });

    it("reports a saved PAT that is no longer accepted", async () => {
        const { core, getConnection } = await setup({
            gitConfigStr: JSON.stringify({
                personalAccessTokenByProviderId: { github: "ghp_revoked" },
                favoriteProviderId: null
            })
        });

        await core.functions.gitProvidersManagement.load();

        expect(getConnection("github")).toStrictEqual({
            status: "error",
            reason: "personal access token rejected"
        });
    });

    it("keeps the explicit favorite, even when not connected", async () => {
        const { core, getView, getPersisted } = await setup({
            githubPersonalAccessToken: "ghp_valid"
        });

        await core.functions.gitProvidersManagement.load();

        await core.functions.gitAccountUiController.setFavoriteProvider({
            providerId: "forgejo"
        });

        expect(getPersisted().favoriteProviderId).toBe("forgejo");
        expect(getView().favoriteProviderId).toBe("forgejo");
        expect(getView().identityPlaceholder).toBe(undefined);
        expect(
            getView().providerCards.map(({ id, isFavorite }) => [id, isFavorite])
        ).toStrictEqual([
            ["gitlab", false],
            ["forgejo", true],
            ["github", false]
        ]);
    });
});
