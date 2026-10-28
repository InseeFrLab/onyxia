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
import { createServiceCredentialsMarker } from "./decoupledLogic/serviceCredentialsMarkers";

const mocks = vi.hoisted(() => ({
    context: undefined as unknown,
    save: vi.fn()
}));

vi.mock("core/rootContext", () => ({ getRootContext: () => mocks.context }));

// NOTE: Kept out of vi.resetModules() (mocks registry), so that the errors thrown by the
// fakes are instances of the classes the reloaded usecase checks against.
vi.mock("core/ports/GitProvider", async importOriginal => await importOriginal());
vi.mock("core/ports/OAuthAuthorization", async importOriginal => await importOriginal());

vi.mock("core/usecases/userAuthentication", () => ({
    selectors: {
        main: (state: { userAuthentication: unknown }) => state.userAuthentication
    }
}));

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
const user_onyxia = { username: "kc-jdoe", email: "jdoe@insee.fr" };
const user_gitHub: GitUser = { username: "jdoe-gh", name: "Jane", email: undefined };

function createFakeConfig(params: {
    id: string;
    type: GitProvidersConfig.ProviderType;
    url: string;
    ui: GitProvidersConfig.Authentication.Ui;
}): GitProvidersConfig.Provider {
    const { id, type, url, ui } = params;

    return {
        id,
        type,
        url,
        displayName: id,
        logoUrl: undefined,
        documentation: undefined,
        authentication: { ui, service: { type: "personal-access-token" } }
    };
}

function createFakeOAuthProvider(params: {
    id: string;
    type: GitProvidersConfig.ProviderType;
    withRevoke: boolean;
}) {
    const config = createFakeConfig({
        id: params.id,
        type: params.type,
        url: `https://${params.id}`,
        ui: { type: "oauth", clientId: "x" }
    });

    const calls = {
        refresh: vi.fn<(refreshToken: string) => void>(),
        revoke: vi.fn<(refreshToken: string) => void>(),
        getUser: vi.fn<(accessToken: string) => void>()
    };

    const behavior = {
        isRefreshRejected: false,
        isRevocationFailing: false,
        rejectedAccessTokens: new Set<string>()
    };

    let refreshCount = 0;

    const gitProvider: GitProvider = {
        userConnection: {
            method: "oauth",
            getAuthorizationUrl: ({ state }) => `https://${params.id}/authorize?${state}`,
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
                ? async ({ refreshToken }) => {
                      calls.revoke(refreshToken);
                      if (behavior.isRevocationFailing) {
                          throw new Error("Network error");
                      }
                  }
                : undefined,
            authorizedApplicationsUrl: `https://${params.id}/applications`
        },
        serviceCredentials: { method: "user-token" },
        getGitUsername: ({ user }) => user.username,
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

    return { config, gitProvider, calls, behavior };
}

function createFakePatProvider(params: { id: string; validToken: string }) {
    const config = createFakeConfig({
        id: params.id,
        type: "github",
        url: "https://github.com",
        ui: { type: "personal-access-token" }
    });

    const gitProvider: GitProvider = {
        userConnection: {
            method: "personal-access-token",
            tokenCreationUrl: "https://github.com/settings/tokens/new"
        },
        serviceCredentials: { method: "user-token" },
        getGitUsername: ({ user }) => user.username,
        getUser: async ({ accessToken }) => {
            if (accessToken !== params.validToken) {
                throw new GitProviderUnauthorizedError();
            }
            return user_gitHub;
        },
        listRepositories: async () => ({ repositories: [], hasNextPage: false })
    };

    return { config, gitProvider };
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

/** The usecase keeps its access tokens at module level: fresh modules for each test */
async function setup(params?: {
    gitConfigStr?: string | null;
    githubPersonalAccessToken?: string | null;
    sessions?: Record<string, string>;
    gitName?: string;
    gitEmail?: string;
    /** GIT_PROVIDERS empty, and the users can't add theirs */
    isIntegrationDisabled?: boolean;
    /** No provider in GIT_PROVIDERS, the users add theirs */
    isWithoutAdminProviders?: boolean;
    /** The token the user providers (fakes) accept */
    validUserProviderToken?: string;
    authorizeInPopup?: () => Promise<{ code: string; codeVerifier: string }>;
}) {
    const {
        gitConfigStr = null,
        githubPersonalAccessToken = null,
        sessions = {},
        gitName = "",
        gitEmail = "",
        isIntegrationDisabled = false,
        isWithoutAdminProviders = false,
        validUserProviderToken = "glpat_valid",
        authorizeInPopup = async () => ({ code: "the-code", codeVerifier: "v" })
    } = params ?? {};

    const userAuthentication = {
        thunks: {},
        selectors: {},
        ...createUsecaseActions({
            name: "userAuthentication",
            initialState: {
                isUserLoggedIn: true,
                isKeycloak: true,
                user: user_onyxia
            },
            reducers: {}
        })
    };

    const userConfigs = {
        thunks: {},
        selectors: {},
        ...createUsecaseActions({
            name: "userConfigs",
            initialState: {
                gitConfigStr,
                githubPersonalAccessToken,
                gitName,
                gitEmail,
                gitCredentialCacheDuration: 0
            } as Record<string, string | number | null>,
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

    const gitLab = createFakeOAuthProvider({
        id: "gitlab",
        type: "gitlab",
        withRevoke: true
    });
    const forgejo = createFakeOAuthProvider({
        id: "forgejo",
        type: "forgejo",
        withRevoke: false
    });
    const gitHub = createFakePatProvider({ id: "github", validToken: "ghp_valid" });

    const { gitSessionStore, refreshTokenByProviderId } =
        createMemorySessionStore(sessions);

    const authorizeInPopupSpy = vi.fn(authorizeInPopup);

    const gitProviders_admin =
        isIntegrationDisabled || isWithoutAdminProviders ? [] : [gitLab, forgejo, gitHub];

    /** The user providers: a PAT provider at the url, unreachable on "down" hosts */
    const createGitProvider = vi.fn(
        ({ config }: { config: GitProvidersConfig.Provider }): GitProvider => {
            const gitProvider_admin = gitProviders_admin.find(
                fake => fake.config.id === config.id
            );

            if (gitProvider_admin !== undefined) {
                return gitProvider_admin.gitProvider;
            }

            return {
                userConnection: {
                    method: "personal-access-token",
                    tokenCreationUrl: `${config.url}/-/user_settings/personal_access_tokens`
                },
                serviceCredentials: { method: "user-token" },
                getGitUsername: ({ user }) => user.username,
                getUser: async ({ accessToken }) => {
                    if (config.url.includes("down")) {
                        throw new TypeError("Failed to fetch");
                    }
                    if (accessToken !== validUserProviderToken) {
                        throw new GitProviderUnauthorizedError();
                    }
                    return user_gitLab;
                },
                listRepositories: async () => ({ repositories: [], hasNextPage: false })
            };
        }
    );

    const context = {
        oidc: { isUserLoggedIn: true },
        gitProvidersConfig: {
            description: undefined,
            providers: gitProviders_admin.map(({ config }) => config),
            disallowUserToAddProviders: isIntegrationDisabled
        },
        createGitProvider,
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
            userConfigs,
            userAuthentication
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

    const getCard = (providerId: string) => {
        const card = getView().providerCards.find(({ id }) => id === providerId);
        assert(card !== undefined);
        return card;
    };

    const getFavorites = () =>
        getView()
            .providerCards.filter(({ favorite }) => favorite === "is favorite")
            .map(({ id }) => id);

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
        getView,
        getCard,
        getFavorites
    };
}

beforeEach(() => {
    mocks.save.mockReset();
    vi.resetModules();
});

describe("gitProvidersManagement", () => {
    it("migrates the former GitHub token once and checks it", async () => {
        const { core, getConnection, getPersisted, getFavorites } = await setup({
            githubPersonalAccessToken: "ghp_valid"
        });

        await core.functions.gitAccountUiController.load();

        expect(getPersisted()).toStrictEqual({
            personalAccessTokenByProviderId: { github: "ghp_valid" },
            favoriteProviderId: null,
            userProviders: []
        });
        expect(getConnection("github")).toStrictEqual({
            status: "connected",
            user: user_gitHub
        });
        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });
        // The first connected provider stands in for the favorite
        expect(getFavorites()).toStrictEqual(["github"]);
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
            core.functions.gitProvidersManagement.signIn({ providerId: "gitlab" })
        ).rejects.toMatchObject({ reason: "popup blocked" });

        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });
    });

    it("revokes on sign out when the provider supports it", async () => {
        const { core, gitLab, refreshTokenByProviderId, getConnection, getCard } =
            await setup({ sessions: { gitlab: "refresh-0", forgejo: "refresh-0" } });

        await core.functions.gitProvidersManagement.load();

        await core.functions.gitAccountUiController.signOut({ providerId: "gitlab" });

        expect(gitLab.calls.revoke).toHaveBeenCalledWith("refresh-1");
        expect(refreshTokenByProviderId.has("gitlab")).toBe(false);
        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });

        // GitLab revoked the grant itself: nothing for the user to do
        expect(getCard("gitlab").authorizedApplications).toBe(undefined);

        await core.functions.gitAccountUiController.signOut({ providerId: "forgejo" });

        expect(getCard("forgejo").authorizedApplications).toStrictEqual({
            url: "https://forgejo/applications",
            reason: "signed out without revocation"
        });
    });

    it("tells where to revoke when the revocation failed", async () => {
        const { core, gitLab, getConnection, getCard } = await setup({
            sessions: { gitlab: "refresh-0" }
        });

        await core.functions.gitProvidersManagement.load();

        gitLab.behavior.isRevocationFailing = true;

        await core.functions.gitAccountUiController.signOut({ providerId: "gitlab" });

        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });
        expect(getCard("gitlab").authorizedApplications).toStrictEqual({
            url: "https://gitlab/applications",
            reason: "signed out without revocation"
        });
    });

    it("saves a PAT only once the provider accepted it", async () => {
        const { core, getConnection, getPersisted } = await setup();

        await core.functions.gitProvidersManagement.load();

        expect(
            await core.functions.gitProvidersManagement.setPersonalAccessToken({
                providerId: "github",
                personalAccessToken: "ghp_wrong"
            })
        ).toStrictEqual({ isAccepted: false });
        expect(getPersisted()).toBe(null);

        expect(
            await core.functions.gitProvidersManagement.setPersonalAccessToken({
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

        await core.functions.gitProvidersManagement.removePersonalAccessToken({
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
        const { core, getFavorites, getPersisted } = await setup({
            githubPersonalAccessToken: "ghp_valid"
        });

        await core.functions.gitProvidersManagement.load();

        await core.functions.gitAccountUiController.setFavoriteProvider({
            providerId: "forgejo"
        });

        expect(getPersisted().favoriteProviderId).toBe("forgejo");
        expect(getFavorites()).toStrictEqual(["forgejo"]);
    });

    describe("getGitContext", () => {
        it("takes the favorite's PAT and identity, the email of the Onyxia account when it's private", async () => {
            const { core } = await setup({
                githubPersonalAccessToken: "ghp_valid"
            });

            expect(
                await core.functions.gitProvidersManagement.getGitContext()
            ).toStrictEqual({
                enabled: true,
                providers: [
                    {
                        id: "github",
                        url: "https://github.com",
                        user: { name: user_gitHub.name, email: user_onyxia.email },
                        credentials: {
                            type: "token",
                            username: user_gitHub.username,
                            token: "ghp_valid",
                            expirationTime: undefined
                        }
                    }
                ],
                name: user_gitHub.name,
                email: user_onyxia.email,
                credentials_cache_duration: 0,
                token: "ghp_valid"
            });
        });

        it("ignores the former name and email fields", async () => {
            const { core } = await setup({
                githubPersonalAccessToken: "ghp_valid",
                gitName: "Me",
                gitEmail: "me@example.com"
            });

            expect(
                await core.functions.gitProvidersManagement.getGitContext()
            ).toMatchObject({ name: user_gitHub.name, email: user_onyxia.email });
        });

        it("has no token when the favorite isn't connected", async () => {
            const { core } = await setup({
                githubPersonalAccessToken: "ghp_valid"
            });

            await core.functions.gitProvidersManagement.load();
            await core.functions.gitProvidersManagement.setFavoriteProvider({
                providerId: "forgejo"
            });

            expect(
                (await core.functions.gitProvidersManagement.getGitContext()).token
            ).toBe(undefined);
        });

        it("uses the Onyxia account when nothing is connected", async () => {
            const { core } = await setup({ gitName: "Me", gitEmail: "me@example.com" });

            expect(
                await core.functions.gitProvidersManagement.getGitContext()
            ).toStrictEqual({
                enabled: false,
                providers: [],
                name: user_onyxia.username,
                email: user_onyxia.email,
                credentials_cache_duration: 0,
                token: undefined
            });
        });

        it("is enabled once a provider is connected", async () => {
            const { core } = await setup({ sessions: { gitlab: "refresh-0" } });

            expect(
                (await core.functions.gitProvidersManagement.getGitContext()).enabled
            ).toBe(true);
        });

        it("keeps the former behavior when the integration is disabled", async () => {
            const { core } = await setup({
                isIntegrationDisabled: true,
                gitName: "Me",
                gitEmail: "me@example.com",
                githubPersonalAccessToken: "ghp_legacy"
            });

            expect(
                await core.functions.gitProvidersManagement.getGitContext()
            ).toStrictEqual({
                enabled: true,
                providers: [],
                name: "Me",
                email: "me@example.com",
                credentials_cache_duration: 0,
                token: "ghp_legacy"
            });
        });

        it("has an entry per connected provider, with what the service can use", async () => {
            const { core, gitLab, forgejo } = await setup({
                githubPersonalAccessToken: "ghp_valid",
                sessions: { gitlab: "refresh-0", forgejo: "refresh-0" }
            });

            const helperConfig = {
                clientId: "service-client",
                scopes: ["read_repository", "write_repository"],
                authorizationUrl: "https://gitlab/oauth/authorize",
                tokenUrl: "https://gitlab/oauth/token",
                deviceAuthorizationUrl: "https://gitlab/oauth/authorize_device"
            };

            gitLab.gitProvider.serviceCredentials = {
                method: "oauth",
                helperConfig,
                authorizeAtLaunch: undefined
            };

            // NOTE: Neither a device flow nor a refresh token yet (phase 3): no credentials.
            forgejo.gitProvider.serviceCredentials = {
                method: "oauth",
                helperConfig: { ...helperConfig, deviceAuthorizationUrl: undefined },
                authorizeAtLaunch: undefined
            };

            await core.functions.gitProvidersManagement.load();
            await core.functions.gitProvidersManagement.setFavoriteProvider({
                providerId: "github"
            });

            const gitContext =
                await core.functions.gitProvidersManagement.getGitContext();

            expect(gitContext.providers).toStrictEqual([
                {
                    id: "gitlab",
                    url: "https://gitlab",
                    user: { name: user_gitLab.name, email: user_gitLab.email },
                    credentials: {
                        type: "oauth",
                        ...helperConfig,
                        refreshToken: undefined
                    }
                },
                {
                    id: "forgejo",
                    url: "https://forgejo",
                    user: { name: user_gitLab.name, email: user_gitLab.email },
                    credentials: undefined
                },
                {
                    id: "github",
                    url: "https://github.com",
                    user: { name: user_gitHub.name, email: user_onyxia.email },
                    credentials: {
                        type: "token",
                        username: user_gitHub.username,
                        token: "ghp_valid",
                        expirationTime: undefined
                    }
                }
            ]);

            // NOTE: The deprecated single forge fields follow the favorite.
            expect(gitContext).toMatchObject({
                name: user_gitHub.name,
                email: user_onyxia.email,
                token: "ghp_valid"
            });
        });
    });

    describe("repository picking", () => {
        it("lists the connected providers, the favorite first", async () => {
            const { core, getState } = await setup({
                sessions: { gitlab: "refresh-0" },
                gitConfigStr: JSON.stringify({
                    personalAccessTokenByProviderId: { github: "ghp_valid" },
                    favoriteProviderId: "github",
                    userProviders: []
                })
            });

            await core.functions.gitProvidersManagement.load();

            const { selectors } = await import("./selectors");

            expect(
                selectors
                    .connectedProviders(getState() as never)
                    ?.map(({ providerId, isFavorite }) => ({ providerId, isFavorite }))
            ).toStrictEqual([
                { providerId: "github", isFavorite: true },
                { providerId: "gitlab", isFavorite: false }
            ]);
        });

        it("finds the connected provider of a pasted url", async () => {
            const { core } = await setup({ sessions: { gitlab: "refresh-0" } });

            const { gitProvidersManagement } = core.functions;

            await gitProvidersManagement.load();

            expect(
                gitProvidersManagement.getConnectedProviderIdOfRepositoryUrl({
                    url: " https://gitlab/group/project.git "
                })
            ).toBe("gitlab");
            // Not connected
            expect(
                gitProvidersManagement.getConnectedProviderIdOfRepositoryUrl({
                    url: "https://forgejo/a/b.git"
                })
            ).toBe(undefined);
            // Only a prefix of the host
            expect(
                gitProvidersManagement.getConnectedProviderIdOfRepositoryUrl({
                    url: "https://gitlab.evil.com/a/b.git"
                })
            ).toBe(undefined);
        });
    });

    describe("user providers", () => {
        const addGitLabCom = (
            core: Awaited<ReturnType<typeof setup>>["core"],
            params?: { url?: string; personalAccessToken?: string }
        ) =>
            core.functions.gitProvidersManagement.addUserProvider({
                type: "gitlab",
                url: params?.url ?? "gitlab.com",
                displayName: "",
                personalAccessToken: params?.personalAccessToken ?? " glpat_valid "
            });

        it("is available without GIT_PROVIDERS, the former fields hidden", async () => {
            const { core, getView } = await setup({ isWithoutAdminProviders: true });

            const { gitAccountUiController } = core.functions;

            expect(gitAccountUiController.isAvailable()).toBe(true);
            expect(gitAccountUiController.isLegacySectionVisible()).toBe(false);
            expect(gitAccountUiController.canUserAddProviders()).toBe(true);

            await gitAccountUiController.load();

            expect(getView().providerCards).toStrictEqual([]);
        });

        it("adds a provider once it accepts the token, after the admin's", async () => {
            const { core, getPersisted, getView, getCard, getConnection } = await setup();

            await core.functions.gitProvidersManagement.load();

            expect(await addGitLabCom(core)).toStrictEqual({
                isSuccess: true,
                providerId: "user:gitlab.com"
            });

            expect(getPersisted()).toStrictEqual({
                personalAccessTokenByProviderId: { "user:gitlab.com": "glpat_valid" },
                favoriteProviderId: null,
                userProviders: [
                    {
                        id: "user:gitlab.com",
                        type: "gitlab",
                        url: "https://gitlab.com",
                        displayName: "gitlab.com"
                    }
                ]
            });
            expect(getConnection("user:gitlab.com")).toStrictEqual({
                status: "connected",
                user: user_gitLab
            });
            expect(getView().providerCards.map(({ id }) => id)).toStrictEqual([
                "gitlab",
                "forgejo",
                "github",
                "user:gitlab.com"
            ]);
            expect(getCard("user:gitlab.com")).toMatchObject({
                isAddedByUser: true,
                removeProvider: { isDisabled: false },
                authentication: { isRemoveButtonShown: false }
            });
            expect(getCard("github").removeProvider).toBe(undefined);
        });

        it("saves nothing when the token is rejected or the provider unreachable", async () => {
            const { core, getPersisted } = await setup();

            await core.functions.gitProvidersManagement.load();

            expect(
                await addGitLabCom(core, { personalAccessToken: "wrong" })
            ).toStrictEqual({
                isSuccess: false,
                error: "personal access token rejected"
            });
            expect(
                await addGitLabCom(core, { url: "https://forgejo.down.example" })
            ).toStrictEqual({ isSuccess: false, error: "provider unreachable" });
            expect(await addGitLabCom(core, { url: "https://gitlab/" })).toStrictEqual({
                isSuccess: false,
                error: "invalid url"
            });
            expect(await addGitLabCom(core, { url: "https://github.com" })).toStrictEqual(
                { isSuccess: false, error: "already configured" }
            );

            expect(getPersisted()).toBe(null);
        });

        it("restores it after a reload, and hands its token to the services", async () => {
            const gitConfigStr = JSON.stringify({
                personalAccessTokenByProviderId: { "user:gitlab.com": "glpat_valid" },
                favoriteProviderId: "user:gitlab.com",
                userProviders: [
                    {
                        id: "user:gitlab.com",
                        type: "gitlab",
                        url: "https://gitlab.com",
                        displayName: "GitLab.com"
                    }
                ]
            });

            const { core } = await setup({ gitConfigStr, isWithoutAdminProviders: true });

            const git = await core.functions.gitProvidersManagement.getGitContext();

            expect(git.providers).toStrictEqual([
                {
                    id: "user:gitlab.com",
                    url: "https://gitlab.com",
                    user: { name: user_gitLab.name, email: user_gitLab.email },
                    credentials: {
                        type: "token",
                        username: user_gitLab.username,
                        token: "glpat_valid",
                        expirationTime: undefined
                    }
                }
            ]);
            expect(git.token).toBe("glpat_valid");
            expect(git.enabled).toBe(true);
        });

        it("removes it with its token, it is no longer the favorite", async () => {
            const { core, getPersisted, getView } = await setup({
                isWithoutAdminProviders: true
            });

            const { gitProvidersManagement, gitAccountUiController } = core.functions;

            await gitProvidersManagement.load();
            await addGitLabCom(core);
            await gitProvidersManagement.setFavoriteProvider({
                providerId: "user:gitlab.com"
            });

            await gitAccountUiController.removeProvider({
                providerId: "user:gitlab.com"
            });

            expect(getPersisted()).toStrictEqual({
                personalAccessTokenByProviderId: {},
                favoriteProviderId: null,
                userProviders: []
            });
            expect(getView().providerCards).toStrictEqual([]);
        });

        it("migrates the former GitHub token to a github.com of the user", async () => {
            const { core, getView } = await setup({
                isWithoutAdminProviders: true,
                githubPersonalAccessToken: "glpat_valid"
            });

            await core.functions.gitAccountUiController.load();

            expect(
                getView().providerCards.map(({ id, status }) => ({ id, status }))
            ).toStrictEqual([{ id: "user:github.com", status: "connected" }]);
        });

        it("ignores them once the admin no longer lets the users add theirs", async () => {
            const gitConfigStr = JSON.stringify({
                personalAccessTokenByProviderId: { "user:gitlab.com": "glpat_valid" },
                favoriteProviderId: null,
                userProviders: [
                    {
                        id: "user:gitlab.com",
                        type: "gitlab",
                        url: "https://gitlab.com",
                        displayName: "gitlab.com"
                    }
                ]
            });

            const { core } = await setup({ gitConfigStr, isIntegrationDisabled: true });

            expect(core.functions.gitAccountUiController.isAvailable()).toBe(false);
            expect(core.functions.gitAccountUiController.isLegacySectionVisible()).toBe(
                true
            );
        });

        it("walks through the add dialog", async () => {
            const { core, getState } = await setup({ isWithoutAdminProviders: true });

            const { gitAccountUiController } = core.functions;

            const getDialog = () =>
                (getState() as never as { gitAccountUiController: any })
                    .gitAccountUiController.addProviderDialog;

            await gitAccountUiController.load();

            expect(
                gitAccountUiController.getPersonalAccessTokenCreationUrl({
                    type: "gitlab",
                    url: "gitlab.com/"
                })
            ).toBe("https://gitlab.com/-/user_settings/personal_access_tokens");
            expect(
                gitAccountUiController.getPersonalAccessTokenCreationUrl({
                    type: "gitlab",
                    url: "not a url"
                })
            ).toBe(undefined);

            gitAccountUiController.openAddProviderDialog();

            const prAdd = gitAccountUiController.addProvider({
                type: "gitlab",
                url: "gitlab.com",
                displayName: "",
                personalAccessToken: "wrong"
            });

            expect(getDialog()).toStrictEqual({
                isOpen: true,
                isSubmitting: true,
                error: undefined
            });

            await prAdd;

            expect(getDialog()).toStrictEqual({
                isOpen: true,
                isSubmitting: false,
                error: "personal access token rejected"
            });

            await gitAccountUiController.addProvider({
                type: "gitlab",
                url: "gitlab.com",
                displayName: "",
                personalAccessToken: "glpat_valid"
            });

            expect(getDialog()).toStrictEqual({
                isOpen: false,
                isSubmitting: false,
                error: undefined
            });
        });
    });

    describe("getServiceGitCredentials", () => {
        const marker = (kind: "access-token" | "refresh-token", providerId: string) =>
            createServiceCredentialsMarker({ kind, providerId });

        const helperConfig = {
            clientId: "service-client",
            scopes: ["read_repository", "write_repository"],
            authorizationUrl: "https://gitlab/oauth/authorize",
            tokenUrl: "https://gitlab/oauth/token",
            deviceAuthorizationUrl: "https://gitlab/oauth/authorize_device"
        };

        const setScopedAccessToken = (fake: {
            config: GitProvidersConfig.Provider;
            gitProvider: GitProvider;
        }) => {
            const createToken = vi.fn<
                Extract<
                    GitProvider["serviceCredentials"],
                    { method: "scoped-token" }
                >["createToken"]
            >(async () => ({ token: "glpat-created" }));

            fake.config.authentication.service = {
                type: "scoped-access-token",
                lifetimeDays: 30
            };
            fake.gitProvider.serviceCredentials = { method: "scoped-token", createToken };

            return { createToken };
        };

        const setServiceOAuth = (fake: {
            config: GitProvidersConfig.Provider;
            gitProvider: GitProvider;
        }) => {
            const exchangeAuthorizationCode = vi.fn(
                async ({ code }: { code: string }) => ({
                    accessToken: `service-access-from-${code}`,
                    refreshToken: `service-refresh-from-${code}`,
                    expirationTime: Date.now() + 3600_000
                })
            );

            fake.gitProvider.serviceCredentials = {
                method: "oauth",
                helperConfig,
                authorizeAtLaunch: {
                    getAuthorizationUrl: ({ state }) =>
                        `https://${fake.config.id}/service-authorize?${state}`,
                    exchangeAuthorizationCode
                }
            };

            return { exchangeAuthorizationCode };
        };

        it("puts markers for the token created at launch, then creates it", async () => {
            const { core, gitLab } = await setup({ sessions: { gitlab: "refresh-0" } });

            const { createToken } = setScopedAccessToken(gitLab);

            const gitContext =
                await core.functions.gitProvidersManagement.getGitContext();

            const credentials = gitContext.providers[0]?.credentials;

            assert(credentials?.type === "token");

            // GitLab comes first in the configuration: it is the favorite
            expect(gitContext.token).toBe(marker("access-token", "gitlab"));
            expect(credentials).toMatchObject({
                username: user_gitLab.username,
                token: marker("access-token", "gitlab")
            });
            expect(createToken).not.toHaveBeenCalled();

            const result =
                await core.functions.gitProvidersManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: [marker("access-token", "gitlab")]
                });

            expect(createToken).toHaveBeenCalledWith({
                accessToken: "access-1",
                name: "onyxia-vscode-123",
                expirationTime: credentials.expirationTime
            });
            expect(result).toStrictEqual({
                isSuccess: true,
                valueByMarker: {
                    [marker("access-token", "gitlab")]: "glpat-created"
                }
            });
        });

        it("creates nothing and opens no popup when no marker is left", async () => {
            const { core, gitLab, authorizeInPopupSpy } = await setup({
                sessions: { gitlab: "refresh-0" }
            });

            const { createToken } = setScopedAccessToken(gitLab);

            await core.functions.gitProvidersManagement.getGitContext();

            expect(
                await core.functions.gitProvidersManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: []
                })
            ).toStrictEqual({ isSuccess: true, valueByMarker: {} });
            expect(createToken).not.toHaveBeenCalled();
            expect(authorizeInPopupSpy).not.toHaveBeenCalled();
        });

        it("authorizes the service of the favorite in a popup, before anything is awaited", async () => {
            const { core, gitLab, forgejo, authorizeInPopupSpy } = await setup({
                sessions: { gitlab: "refresh-0", forgejo: "refresh-0" }
            });

            setServiceOAuth(gitLab);
            setServiceOAuth(forgejo);

            const gitContext =
                await core.functions.gitProvidersManagement.getGitContext();

            expect(gitContext.token).toBe(marker("access-token", "gitlab"));
            expect(
                gitContext.providers.map(({ credentials }) => credentials)
            ).toStrictEqual([
                {
                    type: "oauth",
                    ...helperConfig,
                    refreshToken: marker("refresh-token", "gitlab")
                },
                // NOTE: Not the favorite, the device flow is all it has.
                { type: "oauth", ...helperConfig, refreshToken: undefined }
            ]);

            authorizeInPopupSpy.mockClear();

            const prResult =
                core.functions.gitProvidersManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: [
                        marker("access-token", "gitlab"),
                        marker("refresh-token", "gitlab")
                    ]
                });

            expect(authorizeInPopupSpy).toHaveBeenCalledTimes(1);

            expect(await prResult).toStrictEqual({
                isSuccess: true,
                valueByMarker: {
                    [marker("access-token", "gitlab")]: "service-access-from-the-code",
                    [marker("refresh-token", "gitlab")]: "service-refresh-from-the-code"
                }
            });
        });

        it("reports a blocked popup", async () => {
            const { core, gitLab } = await setup({
                sessions: { gitlab: "refresh-0" },
                authorizeInPopup: () =>
                    Promise.reject(
                        new OAuthAuthorizationError("popup blocked", "blocked")
                    )
            });

            const { exchangeAuthorizationCode } = setServiceOAuth(gitLab);

            await core.functions.gitProvidersManagement.getGitContext();

            expect(
                await core.functions.gitProvidersManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: [marker("refresh-token", "gitlab")]
                })
            ).toStrictEqual({
                isSuccess: false,
                error: {
                    providerId: "gitlab",
                    providerDisplayName: "gitlab",
                    reason: "popup blocked",
                    detail: undefined
                }
            });
            expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
        });

        it("reports a token GitLab refuses to create, with its message", async () => {
            const { core, gitLab } = await setup({ sessions: { gitlab: "refresh-0" } });

            const { createToken } = setScopedAccessToken(gitLab);

            createToken.mockRejectedValue(new Error("needs the api scope"));

            await core.functions.gitProvidersManagement.getGitContext();

            expect(
                await core.functions.gitProvidersManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: [marker("access-token", "gitlab")]
                })
            ).toMatchObject({
                isSuccess: false,
                error: { reason: "request failed", detail: "needs the api scope" }
            });
        });

        it("asks to sign in again when the session expired", async () => {
            const { core, gitLab, getConnection } = await setup({
                sessions: { gitlab: "refresh-0" }
            });

            const { createToken } = setScopedAccessToken(gitLab);

            await core.functions.gitProvidersManagement.getGitContext();

            // NOTE: The access token is rejected, then the refresh token.
            createToken.mockRejectedValue(new GitProviderUnauthorizedError());
            gitLab.behavior.isRefreshRejected = true;

            expect(
                await core.functions.gitProvidersManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: [marker("access-token", "gitlab")]
                })
            ).toMatchObject({
                isSuccess: false,
                error: { reason: "sign in required" }
            });
            expect(getConnection("gitlab")).toStrictEqual({
                status: "error",
                reason: "session expired"
            });
        });
    });

    describe("gitAccountUiController", () => {
        it("shows a blocked popup on the card, without rejecting", async () => {
            const { core, getCard } = await setup({
                authorizeInPopup: () =>
                    Promise.reject(
                        new OAuthAuthorizationError("popup blocked", "blocked")
                    )
            });

            await core.functions.gitProvidersManagement.load();

            const prSignIn = core.functions.gitAccountUiController.signIn({
                providerId: "gitlab"
            });

            expect(getCard("gitlab").pendingAction).toBe("sign in");
            assert(getCard("gitlab").authentication.type === "oauth");
            expect(getCard("gitlab").authentication.isDisabled).toBe(true);

            await prSignIn;

            expect(getCard("gitlab")).toMatchObject({
                pendingAction: undefined,
                error: { type: "popup blocked" },
                status: "setup required",
                authentication: { signIn: { label: "sign in" }, isDisabled: false }
            });
        });

        it("explains a Forgejo grant given with other scopes", async () => {
            const { core, getCard } = await setup({
                authorizeInPopup: () =>
                    Promise.reject(
                        new OAuthAuthorizationError(
                            "denied",
                            "denied",
                            "a grant exists with different scope"
                        )
                    )
            });

            await core.functions.gitProvidersManagement.load();

            await core.functions.gitAccountUiController.signIn({ providerId: "forgejo" });

            expect(getCard("forgejo")).toMatchObject({
                error: { type: "grant scope conflict" },
                authorizedApplications: {
                    url: "https://forgejo/applications",
                    reason: "grant scope conflict"
                }
            });
        });

        it("keeps the provider's reason of a denial", async () => {
            const { core, getCard } = await setup({
                authorizeInPopup: () =>
                    Promise.reject(
                        new OAuthAuthorizationError("denied", "denied", "access_denied")
                    )
            });

            await core.functions.gitProvidersManagement.load();

            await core.functions.gitAccountUiController.signIn({ providerId: "gitlab" });

            expect(getCard("gitlab").error).toStrictEqual({
                type: "sign in denied",
                providerError: "access_denied"
            });
        });

        it("offers to sign in again when the session expired", async () => {
            const { core, gitLab, getCard } = await setup({
                sessions: { gitlab: "refresh-0" }
            });

            gitLab.behavior.isRefreshRejected = true;

            await core.functions.gitProvidersManagement.load();

            expect(getCard("gitlab")).toMatchObject({
                status: "connection error",
                message: { type: "error", reason: "session expired" },
                authentication: { signIn: { label: "sign in again" } }
            });
        });

        it("shows the git identity of the favorite as the one used at launch", async () => {
            const { core, getCard } = await setup({
                githubPersonalAccessToken: "ghp_valid",
                sessions: { gitlab: "refresh-0" }
            });

            await core.functions.gitProvidersManagement.load();

            expect(getCard("gitlab").gitIdentity).toStrictEqual({
                name: user_gitLab.name,
                email: user_gitLab.email,
                isUsedAtLaunch: true
            });
            expect(getCard("github").gitIdentity).toStrictEqual({
                name: user_gitHub.name,
                email: undefined,
                isUsedAtLaunch: false
            });
            expect(getCard("forgejo").gitIdentity).toBe(undefined);
        });

        it("walks through the personal access token form", async () => {
            const { core, getCard, getPersisted } = await setup();

            await core.functions.gitProvidersManagement.load();

            expect(getCard("github").authentication).toMatchObject({
                isFormShown: true,
                isReplaceButtonShown: false,
                isRemoveButtonShown: false
            });

            await core.functions.gitAccountUiController.setPersonalAccessToken({
                providerId: "github",
                personalAccessToken: "ghp_wrong"
            });

            expect(getCard("github").error).toStrictEqual({
                type: "personal access token rejected"
            });
            expect(getCard("github").authentication).toMatchObject({ isFormShown: true });
            expect(getPersisted()).toBe(null);

            await core.functions.gitAccountUiController.setPersonalAccessToken({
                providerId: "github",
                personalAccessToken: "ghp_valid"
            });

            expect(getCard("github")).toMatchObject({
                error: undefined,
                status: "connected",
                authentication: {
                    isFormShown: false,
                    isReplaceButtonShown: true,
                    isCancelButtonShown: false,
                    isRemoveButtonShown: true
                }
            });

            core.functions.gitAccountUiController.startReplacingPersonalAccessToken({
                providerId: "github"
            });

            expect(getCard("github").authentication).toMatchObject({
                isFormShown: true,
                isReplaceButtonShown: false,
                isCancelButtonShown: true,
                isRemoveButtonShown: false
            });

            core.functions.gitAccountUiController.cancelReplacingPersonalAccessToken({
                providerId: "github"
            });

            expect(getCard("github").authentication).toMatchObject({
                isFormShown: false,
                isReplaceButtonShown: true
            });
        });
    });
});
