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
        service:
            gitProvider.service.type === "personal-access-token"
                ? { type: "personal-access-token" }
                : { type: "scoped-access-token", lifetimeDays: 30 }
    }
});

/** The usecase keeps its access tokens at module level: fresh modules for each test */
async function setup(params?: {
    gitConfigStr?: string | null;
    githubPersonalAccessToken?: string | null;
    sessions?: Record<string, string>;
    gitName?: string;
    gitEmail?: string;
    /** GIT_PROVIDERS empty */
    isIntegrationDisabled?: boolean;
    authorizeInPopup?: () => Promise<{ code: string; codeVerifier: string }>;
}) {
    const {
        gitConfigStr = null,
        githubPersonalAccessToken = null,
        sessions = {},
        gitName = "",
        gitEmail = "",
        isIntegrationDisabled = false,
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

    const gitLab = createFakeOAuthProvider({ id: "gitlab", withRevoke: true });
    const forgejo = createFakeOAuthProvider({ id: "forgejo", withRevoke: false });
    const gitHub = createFakePatProvider({ id: "github", validToken: "ghp_valid" });

    const { gitSessionStore, refreshTokenByProviderId } =
        createMemorySessionStore(sessions);

    const authorizeInPopupSpy = vi.fn(authorizeInPopup);

    const gitProviders = isIntegrationDisabled
        ? []
        : [gitLab.gitProvider, forgejo.gitProvider, gitHub.gitProvider];

    const context = {
        oidc: { isUserLoggedIn: true },
        gitProvidersConfig: {
            description: undefined,
            providers: isIntegrationDisabled
                ? []
                : [
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
            favoriteProviderId: null
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

        it("keeps the former behavior without GIT_PROVIDERS", async () => {
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

            gitLab.gitProvider.service = {
                type: "oauth",
                helperConfig,
                authorization: undefined
            };

            // NOTE: Neither a device flow nor a refresh token yet (phase 3): no credentials.
            forgejo.gitProvider.service = {
                type: "oauth",
                helperConfig: { ...helperConfig, deviceAuthorizationUrl: undefined },
                authorization: undefined
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

    describe("getServiceGitCredentials", () => {
        const marker = (
            kind: "access-token" | "username" | "refresh-token",
            providerId: string
        ) => createServiceCredentialsMarker({ kind, providerId });

        const helperConfig = {
            clientId: "service-client",
            scopes: ["read_repository", "write_repository"],
            authorizationUrl: "https://gitlab/oauth/authorize",
            tokenUrl: "https://gitlab/oauth/token",
            deviceAuthorizationUrl: "https://gitlab/oauth/authorize_device"
        };

        const setScopedAccessToken = (gitProvider: GitProvider) => {
            const createAccessToken = vi.fn<
                Extract<
                    GitProvider["service"],
                    { type: "scoped-access-token" }
                >["createAccessToken"]
            >(async ({ expirationTime }) => ({
                id: "42",
                token: "glpat-created",
                gitUsername: "oauth2",
                expirationTime
            }));

            gitProvider.service = {
                type: "scoped-access-token",
                lifetimeDays: 30,
                createAccessToken
            };

            return { createAccessToken };
        };

        const setServiceOAuth = (gitProvider: GitProvider) => {
            const exchangeAuthorizationCode = vi.fn(
                async ({ code }: { code: string }) => ({
                    accessToken: `service-access-from-${code}`,
                    refreshToken: `service-refresh-from-${code}`,
                    expirationTime: Date.now() + 3600_000
                })
            );

            gitProvider.service = {
                type: "oauth",
                helperConfig,
                authorization: {
                    getAuthorizationUrl: ({ state }) =>
                        `https://${gitProvider.id}/service-authorize?${state}`,
                    exchangeAuthorizationCode
                }
            };

            return { exchangeAuthorizationCode };
        };

        it("puts markers for the token created at launch, then creates it", async () => {
            const { core, gitLab } = await setup({ sessions: { gitlab: "refresh-0" } });

            const { createAccessToken } = setScopedAccessToken(gitLab.gitProvider);

            const gitContext =
                await core.functions.gitProvidersManagement.getGitContext();

            const credentials = gitContext.providers[0]?.credentials;

            assert(credentials?.type === "token");

            // GitLab comes first in the configuration: it is the favorite
            expect(gitContext.token).toBe(marker("access-token", "gitlab"));
            expect(credentials).toMatchObject({
                username: marker("username", "gitlab"),
                token: marker("access-token", "gitlab")
            });
            expect(createAccessToken).not.toHaveBeenCalled();

            const result =
                await core.functions.gitProvidersManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: [
                        marker("access-token", "gitlab"),
                        marker("username", "gitlab")
                    ]
                });

            expect(createAccessToken).toHaveBeenCalledWith({
                accessToken: "access-1",
                name: "onyxia-vscode-123",
                repositories: "all",
                permission: "read-write",
                expirationTime: credentials.expirationTime
            });
            expect(result).toStrictEqual({
                isSuccess: true,
                valueByMarker: {
                    [marker("access-token", "gitlab")]: "glpat-created",
                    [marker("username", "gitlab")]: "oauth2"
                }
            });
        });

        it("creates nothing and opens no popup when no marker is left", async () => {
            const { core, gitLab, authorizeInPopupSpy } = await setup({
                sessions: { gitlab: "refresh-0" }
            });

            const { createAccessToken } = setScopedAccessToken(gitLab.gitProvider);

            await core.functions.gitProvidersManagement.getGitContext();

            expect(
                await core.functions.gitProvidersManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: []
                })
            ).toStrictEqual({ isSuccess: true, valueByMarker: {} });
            expect(createAccessToken).not.toHaveBeenCalled();
            expect(authorizeInPopupSpy).not.toHaveBeenCalled();
        });

        it("authorizes the service of the favorite in a popup, before anything is awaited", async () => {
            const { core, gitLab, forgejo, authorizeInPopupSpy } = await setup({
                sessions: { gitlab: "refresh-0", forgejo: "refresh-0" }
            });

            setServiceOAuth(gitLab.gitProvider);
            setServiceOAuth(forgejo.gitProvider);

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

            const { exchangeAuthorizationCode } = setServiceOAuth(gitLab.gitProvider);

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

            const { createAccessToken } = setScopedAccessToken(gitLab.gitProvider);

            createAccessToken.mockRejectedValue(new Error("needs the api scope"));

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

            const { createAccessToken } = setScopedAccessToken(gitLab.gitProvider);

            await core.functions.gitProvidersManagement.getGitContext();

            // NOTE: The access token is rejected, then the refresh token.
            createAccessToken.mockRejectedValue(new GitProviderUnauthorizedError());
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
