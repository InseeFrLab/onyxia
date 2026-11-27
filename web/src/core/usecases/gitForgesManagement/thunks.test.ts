import { beforeEach, expect, it, vi, describe } from "vitest";
import { createCore, createUsecaseActions } from "clean-architecture";
import type { Context } from "core/bootstrap";
import {
    GitForgeUnauthorizedError,
    OAuthAuthorizationError,
    type GitForge,
    type GitUser
} from "core/ports/GitForge";
import type { RawGitForge } from "core/adapters/gitForge/RawGitForge";
import type { GitSessionStore } from "core/adapters/gitForge/gitSessionStore";
import { createGitForgeFromRaw } from "core/adapters/gitForge/createGitForgeFromRaw";
import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";
import { assert } from "tsafe/assert";
import { createServiceCredentialsMarker } from "./decoupledLogic/serviceCredentialsMarkers";

const mocks = vi.hoisted(() => ({
    save: vi.fn()
}));

// NOTE: Kept out of vi.resetModules() (mocks registry), so that the errors thrown by the
// fakes are instances of the classes the reloaded usecase checks against.
vi.mock("core/ports/GitForge", async importOriginal => await importOriginal());

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
    type: GitForgesConfig.ForgeType;
    url: string;
    ui: GitForgesConfig.Authentication.Ui;
}): GitForgesConfig.Forge {
    const { id, type, url, ui } = params;

    return {
        id,
        type,
        url,
        displayName: id,
        logoUrl: undefined,
        authentication: { ui, service: { type: "personal-access-token" } }
    };
}

function createFakeOAuthForge(params: {
    id: string;
    type: GitForgesConfig.ForgeType;
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
        getUser: vi.fn<(accessToken: string) => void>(),
        listBranches: vi.fn<(repositoryFullPath: string) => void>()
    };

    const behavior = {
        isRefreshRejected: false,
        isRevocationFailing: false,
        rejectedAccessTokens: new Set<string>()
    };

    let refreshCount = 0;

    const gitForge: RawGitForge = {
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
                    throw new GitForgeUnauthorizedError();
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
                throw new GitForgeUnauthorizedError();
            }
            return user_gitLab;
        },
        listRepositories: async ({ accessToken }) => {
            if (behavior.rejectedAccessTokens.has(accessToken)) {
                throw new GitForgeUnauthorizedError();
            }
            return { repositories: [], hasNextPage: false };
        },
        listBranches: async ({ repositoryFullPath, search }) => {
            calls.listBranches(repositoryFullPath);
            return {
                branches: ["main", "dev", "feat/x"].filter(name => name.includes(search))
            };
        }
    };

    return { config, gitForge, calls, behavior };
}

function createFakePatForge(params: {
    id: string;
    validToken: string;
    getTokenExpirationTime?: () => Promise<number | undefined>;
}) {
    const config = createFakeConfig({
        id: params.id,
        type: "github",
        url: "https://github.com",
        ui: { type: "personal-access-token" }
    });

    const gitForge: RawGitForge = {
        userConnection: {
            method: "personal-access-token",
            tokenCreationUrl: "https://github.com/settings/tokens/new",
            getTokenExpirationTime: params.getTokenExpirationTime
        },
        serviceCredentials: { method: "user-token" },
        getGitUsername: ({ user }) => user.username,
        getUser: async ({ accessToken }) => {
            if (accessToken !== params.validToken) {
                throw new GitForgeUnauthorizedError();
            }
            return user_gitHub;
        },
        listRepositories: async () => ({ repositories: [], hasNextPage: false }),
        listBranches: async () => ({ branches: [] })
    };

    return { config, gitForge };
}

function createMemorySessionStore(initial: Record<string, string>) {
    const refreshTokenByForgeId = new Map(Object.entries(initial));

    const gitSessionStore: GitSessionStore = {
        get: ({ forgeId }) => {
            const refreshToken = refreshTokenByForgeId.get(forgeId);
            return refreshToken === undefined ? undefined : { refreshToken };
        },
        set: ({ forgeId, refreshToken }) =>
            refreshTokenByForgeId.set(forgeId, refreshToken),
        remove: ({ forgeId }) => refreshTokenByForgeId.delete(forgeId),
        runExclusive: ({ callback }) => callback()
    };

    return { gitSessionStore, refreshTokenByForgeId };
}

/** The usecase keeps its access tokens at module level: fresh modules for each test */
async function setup(params?: {
    gitConfigStr?: string | null;
    githubPersonalAccessToken?: string | null;
    sessions?: Record<string, string>;
    /** GIT_FORGES empty, and the users can't add theirs */
    isIntegrationDisabled?: boolean;
    /** No forge in GIT_FORGES, the users add theirs */
    isWithoutAdminForges?: boolean;
    /** The token the user forges (fakes) accept */
    validUserForgeToken?: string;
    authorizeInPopup?: () => Promise<{ code: string; codeVerifier: string }>;
    getTokenExpirationTime?: () => Promise<number | undefined>;
}) {
    const {
        gitConfigStr = null,
        githubPersonalAccessToken = null,
        sessions = {},
        isIntegrationDisabled = false,
        isWithoutAdminForges = false,
        validUserForgeToken = "glpat_valid",
        authorizeInPopup = async () => ({ code: "the-code", codeVerifier: "v" }),
        getTokenExpirationTime
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
                githubPersonalAccessToken
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

    const gitLab = createFakeOAuthForge({
        id: "gitlab",
        type: "gitlab",
        withRevoke: true
    });
    const forgejo = createFakeOAuthForge({
        id: "forgejo",
        type: "forgejo",
        withRevoke: false
    });
    const gitHub = createFakePatForge({
        id: "github",
        validToken: "ghp_valid",
        getTokenExpirationTime
    });

    const { gitSessionStore, refreshTokenByForgeId } = createMemorySessionStore(sessions);

    const authorizeInPopupSpy = vi.fn(authorizeInPopup);

    const gitForges_admin =
        isIntegrationDisabled || isWithoutAdminForges ? [] : [gitLab, forgejo, gitHub];

    const oauthAuthorization = {
        redirectUri: "https://onyxia/git/oauth/callback",
        authorizeInPopup: authorizeInPopupSpy
    };

    /** The user forges: a PAT forge at the url, unreachable on "down" hosts */
    const createGitForge = vi.fn(
        ({ config }: { config: GitForgesConfig.Forge }): GitForge => {
            const gitForge_admin = gitForges_admin.find(
                fake => fake.config.id === config.id
            );

            if (gitForge_admin !== undefined) {
                // NOTE: Wrapped on each access, the tests swap the fake's methods.
                return new Proxy({} as GitForge, {
                    get: (_, key) =>
                        createGitForgeFromRaw({
                            rawGitForge: gitForge_admin.gitForge,
                            forgeId: config.id,
                            oauthAuthorization,
                            gitSessionStore
                        })[key as keyof GitForge]
                });
            }

            return {
                userConnection: {
                    method: "personal-access-token",
                    tokenCreationUrl: `${config.url}/-/user_settings/personal_access_tokens`,
                    getTokenExpirationTime: undefined
                },
                serviceCredentials: { method: "user-token" },
                getGitUsername: ({ user }) => user.username,
                getUser: async ({ accessToken }) => {
                    if (config.url.includes("down")) {
                        throw new TypeError("Failed to fetch");
                    }
                    if (accessToken !== validUserForgeToken) {
                        throw new GitForgeUnauthorizedError();
                    }
                    return user_gitLab;
                },
                listRepositories: async () => ({ repositories: [], hasNextPage: false }),
                listBranches: async () => ({ branches: [] })
            };
        }
    );

    const context = {
        oidc: { isUserLoggedIn: true },
        gitForgesConfig: {
            description: undefined,
            forges: gitForges_admin.map(({ config }) => config),
            disallowUserToAddForges: isIntegrationDisabled
        },
        createGitForge
    } as unknown as Context;

    const management = await import("./index");
    const account = await import("../gitAccountUiController");

    const { core, dispatch, getState } = createCore({
        context,
        usecases: {
            gitForgesManagement: management,
            gitAccountUiController: account,
            userConfigs,
            userAuthentication
        }
    });

    const getConnection = (forgeId: string) =>
        management.selectors
            .connections(getState() as never)
            ?.find(entry => entry.forgeId === forgeId)?.connection;

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

    const getCard = (forgeId: string) => {
        const card = getView().forgeCards.find(({ id }) => id === forgeId);
        assert(card !== undefined);
        return card;
    };

    return {
        core,
        dispatch,
        getState,
        gitLab,
        forgejo,
        refreshTokenByForgeId,
        authorizeInPopupSpy,
        getConnection,
        getPersisted,
        getView,
        getCard
    };
}

beforeEach(() => {
    mocks.save.mockReset();
    vi.resetModules();
});

describe("gitForgesManagement", () => {
    it("migrates the former GitHub token once and checks it", async () => {
        const { core, getConnection, getPersisted } = await setup({
            githubPersonalAccessToken: "ghp_valid"
        });

        await core.functions.gitAccountUiController.load();

        expect(getPersisted()).toStrictEqual({
            personalAccessTokenByForgeId: { github: "ghp_valid" },
            userForges: []
        });
        expect(getConnection("github")).toStrictEqual({
            status: "connected",
            user: user_gitHub,
            personalAccessTokenExpirationTime: undefined
        });
        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });
    });

    it("doesn't migrate again once gitConfigStr exists", async () => {
        const { core, getPersisted } = await setup({
            githubPersonalAccessToken: "ghp_valid",
            gitConfigStr: JSON.stringify({
                personalAccessTokenByForgeId: {}
            })
        });

        await core.functions.gitAccountUiController.load();

        expect(getPersisted().personalAccessTokenByForgeId).toStrictEqual({});
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
            core.functions.gitForgesManagement.load()
        ]);

        expect(gitLab.calls.refresh).toHaveBeenCalledTimes(1);
    });

    it("restores an OAuth session and rotates the refresh token", async () => {
        const { core, gitLab, refreshTokenByForgeId, getConnection } = await setup({
            sessions: { gitlab: "refresh-0" }
        });

        await core.functions.gitForgesManagement.load();

        expect(gitLab.calls.refresh).toHaveBeenCalledWith("refresh-0");
        expect(refreshTokenByForgeId.get("gitlab")).toBe("refresh-1");
        expect(getConnection("gitlab")).toStrictEqual({
            status: "connected",
            user: user_gitLab,
            personalAccessTokenExpirationTime: undefined
        });
    });

    it("expires the session when the refresh token is rejected", async () => {
        const { core, gitLab, refreshTokenByForgeId, getConnection } = await setup({
            sessions: { gitlab: "refresh-0" }
        });

        gitLab.behavior.isRefreshRejected = true;

        await core.functions.gitForgesManagement.load();

        expect(getConnection("gitlab")).toStrictEqual({
            status: "error",
            reason: "session expired"
        });
        expect(refreshTokenByForgeId.has("gitlab")).toBe(false);
    });

    it("refreshes on 401 and retries once", async () => {
        const { core, gitLab } = await setup({ sessions: { gitlab: "refresh-0" } });

        await core.functions.gitForgesManagement.load();

        // The access token got revoked on the forge in the meantime
        gitLab.behavior.rejectedAccessTokens.add("access-1");

        await core.functions.gitForgesManagement.listRepositories({
            forgeId: "gitlab",
            search: "",
            page: 1
        });

        expect(gitLab.calls.refresh).toHaveBeenCalledTimes(2);

        // The new access token is kept
        await core.functions.gitForgesManagement.listRepositories({
            forgeId: "gitlab",
            search: "",
            page: 1
        });

        expect(gitLab.calls.refresh).toHaveBeenCalledTimes(2);
    });

    it("signs in with the popup", async () => {
        const { core, refreshTokenByForgeId, getConnection, authorizeInPopupSpy } =
            await setup();

        await core.functions.gitForgesManagement.load();

        const prSignIn = core.functions.gitAccountUiController.signIn({
            forgeId: "gitlab"
        });

        // NOTE: Synchronously, so that the browser doesn't block the popup.
        expect(authorizeInPopupSpy).toHaveBeenCalledTimes(1);
        expect(getConnection("gitlab")).toStrictEqual({ status: "connecting" });

        await prSignIn;

        expect(refreshTokenByForgeId.get("gitlab")).toBe("refresh-from-the-code");
        expect(getConnection("gitlab")).toStrictEqual({
            status: "connected",
            user: user_gitLab,
            personalAccessTokenExpirationTime: undefined
        });
    });

    it("rejects explicitly when the popup is blocked, and leaves the card as it was", async () => {
        const { core, getConnection } = await setup({
            authorizeInPopup: () =>
                Promise.reject(new OAuthAuthorizationError("popup blocked", "blocked"))
        });

        await core.functions.gitForgesManagement.load();

        await expect(
            core.functions.gitForgesManagement.signIn({ forgeId: "gitlab" })
        ).rejects.toMatchObject({ reason: "popup blocked" });

        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });
    });

    it("revokes on sign out when the forge supports it", async () => {
        const { core, gitLab, refreshTokenByForgeId, getConnection, getCard } =
            await setup({ sessions: { gitlab: "refresh-0", forgejo: "refresh-0" } });

        await core.functions.gitForgesManagement.load();

        await core.functions.gitAccountUiController.signOut({ forgeId: "gitlab" });

        expect(gitLab.calls.revoke).toHaveBeenCalledWith("refresh-1");
        expect(refreshTokenByForgeId.has("gitlab")).toBe(false);
        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });

        // GitLab revoked the grant itself: nothing for the user to do
        expect(getCard("gitlab").authorizedApplications).toBe(undefined);

        await core.functions.gitAccountUiController.signOut({ forgeId: "forgejo" });

        expect(getCard("forgejo").authorizedApplications).toStrictEqual({
            url: "https://forgejo/applications",
            reason: "signed out without revocation"
        });
    });

    it("tells where to revoke when the revocation failed", async () => {
        const { core, gitLab, getConnection, getCard } = await setup({
            sessions: { gitlab: "refresh-0" }
        });

        await core.functions.gitForgesManagement.load();

        gitLab.behavior.isRevocationFailing = true;

        await core.functions.gitAccountUiController.signOut({ forgeId: "gitlab" });

        expect(getConnection("gitlab")).toStrictEqual({ status: "not connected" });
        expect(getCard("gitlab").authorizedApplications).toStrictEqual({
            url: "https://gitlab/applications",
            reason: "signed out without revocation"
        });
    });

    it("reads when a PAT expires", async () => {
        const expirationTime = Date.UTC(2027, 0, 15);

        const { core, getConnection } = await setup({
            getTokenExpirationTime: async () => expirationTime
        });

        await core.functions.gitForgesManagement.load();

        await core.functions.gitForgesManagement.setPersonalAccessToken({
            forgeId: "github",
            personalAccessToken: "ghp_valid"
        });

        expect(getConnection("github")).toStrictEqual({
            status: "connected",
            user: user_gitHub,
            personalAccessTokenExpirationTime: expirationTime
        });
    });

    it("still connects when the expiration of the PAT can't be read", async () => {
        const { core, getConnection } = await setup({
            getTokenExpirationTime: async () => {
                throw new GitForgeUnauthorizedError();
            }
        });

        await core.functions.gitForgesManagement.load();

        await core.functions.gitForgesManagement.setPersonalAccessToken({
            forgeId: "github",
            personalAccessToken: "ghp_valid"
        });

        expect(getConnection("github")).toStrictEqual({
            status: "connected",
            user: user_gitHub,
            personalAccessTokenExpirationTime: undefined
        });
    });

    it("saves a PAT only once the forge accepted it", async () => {
        const { core, getConnection, getPersisted } = await setup();

        await core.functions.gitForgesManagement.load();

        expect(
            await core.functions.gitForgesManagement.setPersonalAccessToken({
                forgeId: "github",
                personalAccessToken: "ghp_wrong"
            })
        ).toStrictEqual({ isAccepted: false });
        expect(getPersisted()).toBe(null);

        expect(
            await core.functions.gitForgesManagement.setPersonalAccessToken({
                forgeId: "github",
                personalAccessToken: " ghp_valid "
            })
        ).toStrictEqual({ isAccepted: true });
        expect(getPersisted().personalAccessTokenByForgeId).toStrictEqual({
            github: "ghp_valid"
        });
        expect(getConnection("github")).toStrictEqual({
            status: "connected",
            user: user_gitHub,
            personalAccessTokenExpirationTime: undefined
        });

        await core.functions.gitForgesManagement.removePersonalAccessToken({
            forgeId: "github"
        });

        expect(getPersisted().personalAccessTokenByForgeId).toStrictEqual({});
        expect(getConnection("github")).toStrictEqual({ status: "not connected" });
    });

    it("reports a saved PAT that is no longer accepted", async () => {
        const { core, getConnection } = await setup({
            gitConfigStr: JSON.stringify({
                personalAccessTokenByForgeId: { github: "ghp_revoked" }
            })
        });

        await core.functions.gitForgesManagement.load();

        expect(getConnection("github")).toStrictEqual({
            status: "error",
            reason: "personal access token rejected"
        });
    });

    describe("getGitContext", () => {
        it("has an entry per connected forge, the email of the Onyxia account when it's private", async () => {
            const { core } = await setup({
                githubPersonalAccessToken: "ghp_valid"
            });

            expect(
                await core.functions.gitForgesManagement.getGitContext()
            ).toStrictEqual({
                enabled: true,
                forges: [
                    {
                        id: "github",
                        url: "https://github.com",
                        user: { name: user_gitHub.name, email: user_onyxia.email },
                        credentials: {
                            type: "token",
                            username: user_gitHub.username,
                            token: "onyxia-git-created-at-launch:access-token:github",
                            expirationTime: undefined
                        }
                    }
                ]
            });
        });

        it("is disabled when nothing is connected", async () => {
            const { core } = await setup();

            expect(
                await core.functions.gitForgesManagement.getGitContext()
            ).toStrictEqual({
                enabled: false,
                forges: []
            });
        });

        it("is enabled once a forge is connected", async () => {
            const { core } = await setup({ sessions: { gitlab: "refresh-0" } });

            expect(
                (await core.functions.gitForgesManagement.getGitContext()).enabled
            ).toBe(true);
        });

        it("is disabled with the integration", async () => {
            const { core } = await setup({
                isIntegrationDisabled: true,
                githubPersonalAccessToken: "ghp_legacy"
            });

            expect(
                await core.functions.gitForgesManagement.getGitContext()
            ).toStrictEqual({
                enabled: false,
                forges: []
            });
        });

        it("has an entry per connected forge, with what the service can use", async () => {
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

            // NOTE: Not called when the context is read, only at launch.
            const authorizeAtLaunch = {
                getAuthorizationUrl: () => "https://unused",
                exchangeAuthorizationCode: () => Promise.reject(new Error("unused"))
            };

            gitLab.gitForge.serviceCredentials = {
                method: "oauth",
                helperConfig,
                authorizeAtLaunch
            };

            forgejo.gitForge.serviceCredentials = {
                method: "oauth",
                helperConfig: { ...helperConfig, deviceAuthorizationUrl: undefined },
                authorizeAtLaunch
            };

            await core.functions.gitForgesManagement.load();

            const gitContext = await core.functions.gitForgesManagement.getGitContext();

            expect(gitContext.forges).toStrictEqual([
                {
                    id: "gitlab",
                    url: "https://gitlab",
                    user: { name: user_gitLab.name, email: user_gitLab.email },
                    credentials: {
                        type: "oauth",
                        ...helperConfig,
                        refreshToken: "onyxia-git-created-at-launch:refresh-token:gitlab"
                    }
                },
                {
                    id: "forgejo",
                    url: "https://forgejo",
                    user: { name: user_gitLab.name, email: user_gitLab.email },
                    credentials: {
                        type: "oauth",
                        ...helperConfig,
                        deviceAuthorizationUrl: undefined,
                        refreshToken: "onyxia-git-created-at-launch:refresh-token:forgejo"
                    }
                },
                {
                    id: "github",
                    url: "https://github.com",
                    user: { name: user_gitHub.name, email: user_onyxia.email },
                    credentials: {
                        type: "token",
                        username: user_gitHub.username,
                        token: "onyxia-git-created-at-launch:access-token:github",
                        expirationTime: undefined
                    }
                }
            ]);
        });
    });

    describe("repository picking", () => {
        it("lists the connected forges, in the order of the configuration", async () => {
            const { core, getState } = await setup({
                sessions: { gitlab: "refresh-0" },
                gitConfigStr: JSON.stringify({
                    personalAccessTokenByForgeId: { github: "ghp_valid" },
                    userForges: []
                })
            });

            await core.functions.gitForgesManagement.load();

            const { selectors } = await import("./selectors");

            expect(
                selectors
                    .connectedForges(getState() as never)
                    ?.map(({ forgeId }) => forgeId)
            ).toStrictEqual(["gitlab", "github"]);
        });

        it("lists the branches of a repository from its clone url", async () => {
            const { core, gitLab } = await setup({ sessions: { gitlab: "refresh-0" } });

            const { gitForgesManagement } = core.functions;

            await gitForgesManagement.load();

            expect(
                await gitForgesManagement.listBranches({
                    forgeId: "gitlab",
                    repositoryUrl: "https://gitlab/group/project.git",
                    search: "e"
                })
            ).toStrictEqual(["dev", "feat/x"]);
            expect(gitLab.calls.listBranches).toHaveBeenCalledWith("group/project");

            // Not a repository of this forge: nothing asked
            expect(
                await gitForgesManagement.listBranches({
                    forgeId: "gitlab",
                    repositoryUrl: "https://forgejo/group/project.git",
                    search: ""
                })
            ).toStrictEqual([]);
            expect(gitLab.calls.listBranches).toHaveBeenCalledTimes(1);
        });
    });

    describe("user forges", () => {
        const addGitLabCom = (
            core: Awaited<ReturnType<typeof setup>>["core"],
            params?: { url?: string; personalAccessToken?: string }
        ) =>
            core.functions.gitForgesManagement.addUserForge({
                type: "gitlab",
                url: params?.url ?? "gitlab.com",
                displayName: "",
                personalAccessToken: params?.personalAccessToken ?? " glpat_valid "
            });

        it("is available without GIT_FORGES", async () => {
            const { core, getView } = await setup({ isWithoutAdminForges: true });

            const { gitAccountUiController } = core.functions;

            expect(gitAccountUiController.isAvailable()).toBe(true);
            expect(gitAccountUiController.canUserAddForges()).toBe(true);

            await gitAccountUiController.load();

            expect(getView().forgeCards).toStrictEqual([]);
        });

        it("adds a forge once it accepts the token, after the admin's", async () => {
            const { core, getPersisted, getView, getCard, getConnection } = await setup();

            await core.functions.gitForgesManagement.load();

            expect(await addGitLabCom(core)).toStrictEqual({
                isSuccess: true,
                forgeId: "user:gitlab.com"
            });

            expect(getPersisted()).toStrictEqual({
                personalAccessTokenByForgeId: { "user:gitlab.com": "glpat_valid" },
                userForges: [
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
                user: user_gitLab,
                personalAccessTokenExpirationTime: undefined
            });
            expect(getView().forgeCards.map(({ id }) => id)).toStrictEqual([
                "gitlab",
                "forgejo",
                "github",
                "user:gitlab.com"
            ]);
            expect(getCard("user:gitlab.com")).toMatchObject({
                isAddedByUser: true,
                removeForge: { isDisabled: false }
            });
            expect(getCard("github").removeForge).toBe(undefined);
        });

        it("saves nothing when the token is rejected or the forge unreachable", async () => {
            const { core, getPersisted } = await setup();

            await core.functions.gitForgesManagement.load();

            expect(
                await addGitLabCom(core, { personalAccessToken: "wrong" })
            ).toStrictEqual({
                isSuccess: false,
                error: "personal access token rejected"
            });
            expect(
                await addGitLabCom(core, { url: "https://forgejo.down.example" })
            ).toStrictEqual({ isSuccess: false, error: "forge unreachable" });
            expect(
                await addGitLabCom(core, { url: "ftp://gitlab.example" })
            ).toStrictEqual({
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
                personalAccessTokenByForgeId: { "user:gitlab.com": "glpat_valid" },
                userForges: [
                    {
                        id: "user:gitlab.com",
                        type: "gitlab",
                        url: "https://gitlab.com",
                        displayName: "GitLab.com"
                    }
                ]
            });

            const { core } = await setup({ gitConfigStr, isWithoutAdminForges: true });

            const git = await core.functions.gitForgesManagement.getGitContext();

            expect(git.forges).toStrictEqual([
                {
                    id: "user:gitlab.com",
                    url: "https://gitlab.com",
                    user: { name: user_gitLab.name, email: user_gitLab.email },
                    credentials: {
                        type: "token",
                        username: user_gitLab.username,
                        token: "onyxia-git-created-at-launch:access-token:user:gitlab.com",
                        expirationTime: undefined
                    }
                }
            ]);
            expect(git.enabled).toBe(true);

            const marker = "onyxia-git-created-at-launch:access-token:user:gitlab.com";

            // NOTE: The PAT itself only at launch, never in the helm values.
            expect(
                await core.functions.gitForgesManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: [marker]
                })
            ).toStrictEqual({
                isSuccess: true,
                valueByMarker: { [marker]: "glpat_valid" }
            });
        });

        it("removes it with its token", async () => {
            const { core, getPersisted, getView } = await setup({
                isWithoutAdminForges: true
            });

            const { gitForgesManagement, gitAccountUiController } = core.functions;

            await gitForgesManagement.load();
            await addGitLabCom(core);

            await gitAccountUiController.removeForge({
                forgeId: "user:gitlab.com"
            });

            expect(getPersisted()).toStrictEqual({
                personalAccessTokenByForgeId: {},
                userForges: []
            });
            expect(getView().forgeCards).toStrictEqual([]);
        });

        it("migrates the former GitHub token to a github.com of the user", async () => {
            const { core, getView } = await setup({
                isWithoutAdminForges: true,
                githubPersonalAccessToken: "glpat_valid"
            });

            await core.functions.gitAccountUiController.load();

            expect(
                getView().forgeCards.map(({ id, status }) => ({ id, status }))
            ).toStrictEqual([{ id: "user:github.com", status: "connected" }]);
        });

        it("ignores them once the admin no longer lets the users add theirs", async () => {
            const gitConfigStr = JSON.stringify({
                personalAccessTokenByForgeId: { "user:gitlab.com": "glpat_valid" },
                userForges: [
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
        });

        it("renames a user forge, keeping its token and its connection", async () => {
            const { core, getPersisted, getConnection, getView } = await setup();

            await core.functions.gitForgesManagement.load();
            await addGitLabCom(core);

            expect(
                await core.functions.gitForgesManagement.updateUserForge({
                    forgeId: "user:gitlab.com",
                    type: "gitlab",
                    url: "https://gitlab.com",
                    displayName: "My GitLab",
                    personalAccessToken: undefined
                })
            ).toStrictEqual({ isSuccess: true, forgeId: "user:gitlab.com" });

            expect(getPersisted()).toStrictEqual({
                personalAccessTokenByForgeId: { "user:gitlab.com": "glpat_valid" },
                userForges: [
                    {
                        id: "user:gitlab.com",
                        type: "gitlab",
                        url: "https://gitlab.com",
                        displayName: "My GitLab"
                    }
                ]
            });
            expect(getConnection("user:gitlab.com")?.status).toBe("connected");
            expect(
                getView().forgeCards.map(({ id, displayName }) => ({
                    id,
                    displayName
                }))
            ).toContainEqual({ id: "user:gitlab.com", displayName: "My GitLab" });
        });

        it("moves a user forge to another url, in place, with a new token", async () => {
            const { core, getPersisted, getConnection, getView } = await setup();

            await core.functions.gitForgesManagement.load();
            await addGitLabCom(core);

            const update = (personalAccessToken: string | undefined) =>
                core.functions.gitForgesManagement.updateUserForge({
                    forgeId: "user:gitlab.com",
                    type: "gitlab",
                    url: "gitlab.example.com",
                    displayName: "",
                    personalAccessToken
                });

            expect(await update(undefined)).toStrictEqual({
                isSuccess: false,
                error: "personal access token required"
            });
            expect(await update("wrong")).toStrictEqual({
                isSuccess: false,
                error: "personal access token rejected"
            });
            expect(getPersisted().userForges[0].id).toBe("user:gitlab.com");

            expect(await update(" glpat_valid ")).toStrictEqual({
                isSuccess: true,
                forgeId: "user:gitlab.example.com"
            });

            expect(getPersisted()).toStrictEqual({
                personalAccessTokenByForgeId: {
                    "user:gitlab.example.com": "glpat_valid"
                },
                userForges: [
                    {
                        id: "user:gitlab.example.com",
                        type: "gitlab",
                        url: "https://gitlab.example.com",
                        displayName: "gitlab.example.com"
                    }
                ]
            });
            expect(getConnection("user:gitlab.example.com")?.status).toBe("connected");
            expect(getView().forgeCards.map(({ id }) => id)).toStrictEqual([
                "gitlab",
                "forgejo",
                "github",
                "user:gitlab.example.com"
            ]);
        });

        it("walks through the add dialog", async () => {
            const { core, getState } = await setup({ isWithoutAdminForges: true });

            const { gitAccountUiController } = core.functions;

            const getDialog = () =>
                (getState() as never as { gitAccountUiController: any })
                    .gitAccountUiController.addForgeDialog;

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

            gitAccountUiController.openAddForgeDialog();

            const prAdd = gitAccountUiController.addForge({
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

            await gitAccountUiController.addForge({
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
        const marker = (kind: "access-token" | "refresh-token", forgeId: string) =>
            createServiceCredentialsMarker({ kind, forgeId });

        const helperConfig = {
            clientId: "service-client",
            scopes: ["read_repository", "write_repository"],
            authorizationUrl: "https://gitlab/oauth/authorize",
            tokenUrl: "https://gitlab/oauth/token",
            deviceAuthorizationUrl: "https://gitlab/oauth/authorize_device"
        };

        const setScopedAccessToken = (fake: {
            config: GitForgesConfig.Forge;
            gitForge: RawGitForge;
        }) => {
            const createToken = vi.fn<
                Extract<
                    GitForge["serviceCredentials"],
                    { method: "scoped-token" }
                >["createToken"]
            >(async () => ({ token: "glpat-created" }));

            fake.config.authentication.service = {
                type: "scoped-access-token",
                lifetimeDays: 30
            };
            fake.gitForge.serviceCredentials = { method: "scoped-token", createToken };

            return { createToken };
        };

        const setServiceOAuth = (fake: {
            config: GitForgesConfig.Forge;
            gitForge: RawGitForge;
        }) => {
            const exchangeAuthorizationCode = vi.fn(
                async ({ code }: { code: string }) => ({
                    accessToken: `service-access-from-${code}`,
                    refreshToken: `service-refresh-from-${code}`,
                    expirationTime: Date.now() + 3600_000
                })
            );

            fake.gitForge.serviceCredentials = {
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

            const gitContext = await core.functions.gitForgesManagement.getGitContext();

            const credentials = gitContext.forges[0]?.credentials;

            assert(credentials?.type === "token");

            expect(credentials).toMatchObject({
                username: user_gitLab.username,
                token: marker("access-token", "gitlab")
            });
            expect(createToken).not.toHaveBeenCalled();

            const result =
                await core.functions.gitForgesManagement.getServiceGitCredentials({
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

            await core.functions.gitForgesManagement.getGitContext();

            expect(
                await core.functions.gitForgesManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: []
                })
            ).toStrictEqual({ isSuccess: true, valueByMarker: {} });
            expect(createToken).not.toHaveBeenCalled();
            expect(authorizeInPopupSpy).not.toHaveBeenCalled();
        });

        it("authorizes the service of every connected forge, before anything is awaited", async () => {
            const { core, gitLab, forgejo, authorizeInPopupSpy } = await setup({
                sessions: { gitlab: "refresh-0", forgejo: "refresh-0" }
            });

            setServiceOAuth(gitLab);
            setServiceOAuth(forgejo);

            const gitContext = await core.functions.gitForgesManagement.getGitContext();

            expect(gitContext.forges.map(({ credentials }) => credentials)).toStrictEqual(
                [
                    {
                        type: "oauth",
                        ...helperConfig,
                        refreshToken: marker("refresh-token", "gitlab")
                    },
                    {
                        type: "oauth",
                        ...helperConfig,
                        refreshToken: marker("refresh-token", "forgejo")
                    }
                ]
            );

            authorizeInPopupSpy.mockClear();

            const prResult = core.functions.gitForgesManagement.getServiceGitCredentials({
                serviceName: "vscode-123",
                markers: [
                    marker("access-token", "gitlab"),
                    marker("refresh-token", "gitlab"),
                    marker("refresh-token", "forgejo")
                ]
            });

            // NOTE: Both synchronously, the adapter queues them in the same popup.
            expect(authorizeInPopupSpy).toHaveBeenCalledTimes(2);

            expect(await prResult).toStrictEqual({
                isSuccess: true,
                valueByMarker: {
                    [marker("access-token", "gitlab")]: "service-access-from-the-code",
                    [marker("refresh-token", "gitlab")]: "service-refresh-from-the-code",
                    [marker("access-token", "forgejo")]: "service-access-from-the-code",
                    [marker("refresh-token", "forgejo")]: "service-refresh-from-the-code"
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

            await core.functions.gitForgesManagement.getGitContext();

            expect(
                await core.functions.gitForgesManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: [marker("refresh-token", "gitlab")]
                })
            ).toStrictEqual({
                isSuccess: false,
                error: {
                    forgeId: "gitlab",
                    forgeDisplayName: "gitlab",
                    reason: "popup blocked",
                    detail: undefined
                }
            });
            expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
        });

        it("creates no token when the authorization of another forge fails", async () => {
            const { core, gitLab, forgejo } = await setup({
                sessions: { gitlab: "refresh-0", forgejo: "refresh-0" },
                authorizeInPopup: () =>
                    Promise.reject(
                        new OAuthAuthorizationError("popup blocked", "blocked")
                    )
            });

            const { createToken } = setScopedAccessToken(gitLab);
            setServiceOAuth(forgejo);

            await core.functions.gitForgesManagement.getGitContext();

            expect(
                await core.functions.gitForgesManagement.getServiceGitCredentials({
                    serviceName: "vscode-123",
                    markers: [
                        marker("access-token", "gitlab"),
                        marker("refresh-token", "forgejo")
                    ]
                })
            ).toMatchObject({
                isSuccess: false,
                error: { forgeId: "forgejo", reason: "popup blocked" }
            });
            expect(createToken).not.toHaveBeenCalled();
        });

        it("reports a token GitLab refuses to create, with its message", async () => {
            const { core, gitLab } = await setup({ sessions: { gitlab: "refresh-0" } });

            const { createToken } = setScopedAccessToken(gitLab);

            createToken.mockRejectedValue(new Error("needs the api scope"));

            await core.functions.gitForgesManagement.getGitContext();

            expect(
                await core.functions.gitForgesManagement.getServiceGitCredentials({
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

            await core.functions.gitForgesManagement.getGitContext();

            // NOTE: The access token is rejected, then the refresh token.
            createToken.mockRejectedValue(new GitForgeUnauthorizedError());
            gitLab.behavior.isRefreshRejected = true;

            expect(
                await core.functions.gitForgesManagement.getServiceGitCredentials({
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

            await core.functions.gitForgesManagement.load();

            const prSignIn = core.functions.gitAccountUiController.signIn({
                forgeId: "gitlab"
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

            await core.functions.gitForgesManagement.load();

            await core.functions.gitAccountUiController.signIn({ forgeId: "forgejo" });

            expect(getCard("forgejo")).toMatchObject({
                error: { type: "grant scope conflict" },
                authorizedApplications: {
                    url: "https://forgejo/applications",
                    reason: "grant scope conflict"
                }
            });
        });

        it("keeps the forge's reason of a denial", async () => {
            const { core, getCard } = await setup({
                authorizeInPopup: () =>
                    Promise.reject(
                        new OAuthAuthorizationError("denied", "denied", "access_denied")
                    )
            });

            await core.functions.gitForgesManagement.load();

            await core.functions.gitAccountUiController.signIn({ forgeId: "gitlab" });

            expect(getCard("gitlab").error).toStrictEqual({
                type: "sign in denied",
                forgeError: "access_denied"
            });
        });

        it("offers to sign in again when the session expired", async () => {
            const { core, gitLab, getCard } = await setup({
                sessions: { gitlab: "refresh-0" }
            });

            gitLab.behavior.isRefreshRejected = true;

            await core.functions.gitForgesManagement.load();

            expect(getCard("gitlab")).toMatchObject({
                status: "connection error",
                message: { type: "error", reason: "session expired" },
                authentication: { signIn: { label: "sign in again" } }
            });
        });

        it("walks through the personal access token form", async () => {
            const { core, getCard, getPersisted } = await setup();

            await core.functions.gitForgesManagement.load();

            expect(getCard("github").authentication).toMatchObject({
                isFormShown: false,
                hasToken: false
            });

            core.functions.gitAccountUiController.startEditingPersonalAccessToken({
                forgeId: "github"
            });

            expect(getCard("github").authentication).toMatchObject({
                isFormShown: true
            });

            await core.functions.gitAccountUiController.setPersonalAccessToken({
                forgeId: "github",
                personalAccessToken: "ghp_wrong"
            });

            expect(getCard("github").error).toStrictEqual({
                type: "personal access token rejected"
            });
            expect(getCard("github").authentication).toMatchObject({ isFormShown: true });
            expect(getPersisted()).toBe(null);

            await core.functions.gitAccountUiController.setPersonalAccessToken({
                forgeId: "github",
                personalAccessToken: "ghp_valid"
            });

            expect(getCard("github")).toMatchObject({
                error: undefined,
                status: "connected",
                authentication: { isFormShown: false, hasToken: true }
            });

            core.functions.gitAccountUiController.startEditingPersonalAccessToken({
                forgeId: "github"
            });

            expect(getCard("github").authentication).toMatchObject({
                isFormShown: true,
                hasToken: true
            });

            core.functions.gitAccountUiController.cancelEditingPersonalAccessToken({
                forgeId: "github"
            });

            expect(getCard("github").authentication).toMatchObject({
                isFormShown: false,
                hasToken: true
            });
        });
    });
});
