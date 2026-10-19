import type { Thunks } from "core/bootstrap";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { Mutex } from "async-mutex";
import {
    GitProviderUnauthorizedError,
    type GitProvider,
    type GitRepository,
    type GitUser
} from "core/ports/GitProvider";
import * as userConfigs from "core/usecases/userConfigs";
import { actions, type Connection } from "./state";
import { protectedSelectors, selectors } from "./selectors";
import {
    createEmptyPersistedGitConfig,
    createMigratedPersistedGitConfig,
    parseGitConfigStr,
    serializeGitConfig,
    type PersistedGitConfig
} from "./decoupledLogic/persistedGitConfig";

/** An access token this close to its expiration is refreshed before being used */
const ACCESS_TOKEN_EXPIRATION_MARGIN_MS = 60_000;

export const thunks = {
    isAvailable:
        () =>
        (...args): boolean => {
            const [, , { gitProviders, oidc }] = args;

            return gitProviders.length !== 0 && oidc.isUserLoggedIn;
        },
    /**
     * Idempotent, and safe to call concurrently: both the account tab and the launcher
     * ask for it, whoever comes second waits for the first instead of starting over.
     * Restores the OAuth sessions and checks the saved PATs.
     */
    load:
        () =>
        async (...args): Promise<void> => {
            const [dispatch, getState, { gitProviders }] = args;

            if (!dispatch(thunks.isAvailable())) {
                return;
            }

            if (globalContext.prLoad !== undefined) {
                return globalContext.prLoad;
            }

            if (selectors.stateDescription(getState()) === "ready") {
                return;
            }

            const prLoad = (async () => {
                dispatch(actions.loadingStarted());

                {
                    const isReadable = await dispatch(
                        privateThunks.migrateOrCheckPersistedGitConfig()
                    );

                    if (!isReadable) {
                        dispatch(actions.loadingFailed({ reason: "unreadable config" }));
                        return;
                    }
                }

                dispatch(
                    actions.loaded({
                        connectionByProviderId: Object.fromEntries(
                            gitProviders.map(gitProvider => [
                                gitProvider.id,
                                id<Connection>({ status: "not connected" })
                            ])
                        )
                    })
                );

                await Promise.all(
                    gitProviders.map(gitProvider =>
                        dispatch(
                            privateThunks.restoreConnection({
                                providerId: gitProvider.id
                            })
                        )
                    )
                );
            })();

            globalContext.prLoad = prLoad;

            try {
                await prLoad;
            } catch {
                dispatch(actions.loadingFailed({ reason: "loading failed" }));
            } finally {
                globalContext.prLoad = undefined;
            }
        },
    /**
     * Discards a persisted config that can't be read back, then loads again. The
     * personal access tokens and the favorite provider it held are lost.
     */
    resetConfig:
        () =>
        async (...args): Promise<void> => {
            const [dispatch, getState] = args;

            assert(selectors.errorReason(getState()) === "unreadable config");

            await dispatch(
                userConfigs.thunks.changeValue({
                    key: "gitConfigStr",
                    value: serializeGitConfig({
                        gitConfig: createEmptyPersistedGitConfig()
                    })
                })
            );

            await dispatch(thunks.load());
        },
    /**
     * The PAT, or the OAuth access token (refreshed when expired). Throws when the
     * provider isn't connected, or when the session turns out to be expired.
     */
    getAccessToken:
        (params: { providerId: string }) =>
        async (...args): Promise<string> => {
            const { providerId } = params;

            const [dispatch] = args;

            return dispatch(
                privateThunks.callWithAccessToken({
                    providerId,
                    call: async accessToken => accessToken
                })
            );
        },
    listRepositories:
        (params: {
            providerId: string;
            search: string;
            page: number;
            signal?: AbortSignal;
        }) =>
        async (
            ...args
        ): Promise<{ repositories: GitRepository[]; hasNextPage: boolean }> => {
            const { providerId, search, page, signal } = params;

            const [dispatch] = args;

            const gitProvider = dispatch(privateThunks.getGitProvider({ providerId }));

            return dispatch(
                privateThunks.callWithAccessToken({
                    providerId,
                    call: accessToken =>
                        gitProvider.listRepositories({
                            accessToken,
                            search,
                            page,
                            signal
                        })
                })
            );
        },
    /**
     * OAuth providers only. Must be dispatched synchronously from the click handler:
     * the popup is opened before anything is awaited. Rejects with
     * OAuthAuthorizationError when the popup is blocked, closed or denied.
     */
    signIn:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch, getState, { oauthAuthorization, gitSessionStore }] = args;

            const gitProvider = dispatch(privateThunks.getGitProvider({ providerId }));

            assert(gitProvider.ui.type === "oauth");

            const { oauth } = gitProvider.ui;
            const { redirectUri } = oauthAuthorization;

            // NOTE: No await before this call, see OAuthAuthorization.authorizeInPopup.
            const prAuthorization = oauthAuthorization.authorizeInPopup({
                getAuthorizationUrl: ({ state, codeChallenge }) =>
                    oauth.getAuthorizationUrl({ redirectUri, state, codeChallenge })
            });

            const connection_before = dispatch(
                privateThunks.getConnection({ providerId })
            );

            assert(selectors.stateDescription(getState()) === "ready");

            dispatch(
                actions.connectionChanged({
                    providerId,
                    connection: { status: "connecting" }
                })
            );

            let user: GitUser;

            try {
                const { code, codeVerifier } = await prAuthorization;

                const tokens = await oauth.exchangeAuthorizationCode({
                    code,
                    codeVerifier,
                    redirectUri
                });

                if (tokens.refreshToken === undefined) {
                    // NOTE: The session won't survive a reload.
                    gitSessionStore.remove({ providerId });
                } else {
                    gitSessionStore.set({
                        providerId,
                        refreshToken: tokens.refreshToken
                    });
                }

                globalContext.oauthAccessTokenByProviderId.set(providerId, {
                    accessToken: tokens.accessToken,
                    expirationTime: tokens.expirationTime
                });

                user = await gitProvider.getUser({ accessToken: tokens.accessToken });
            } catch (error) {
                dispatch(
                    actions.connectionChanged({
                        providerId,
                        connection: connection_before
                    })
                );
                throw error;
            }

            dispatch(
                actions.connectionChanged({
                    providerId,
                    connection: { status: "connected", user }
                })
            );
        },
    /**
     * OAuth providers only. Revokes the grant when the provider supports it, otherwise
     * the user has to revoke it on the provider (authorizedApplicationsUrl). The
     * favorite provider doesn't change.
     */
    signOut:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch, , { gitSessionStore }] = args;

            const gitProvider = dispatch(privateThunks.getGitProvider({ providerId }));

            assert(gitProvider.ui.type === "oauth");

            const session = gitSessionStore.get({ providerId });

            gitSessionStore.remove({ providerId });
            globalContext.oauthAccessTokenByProviderId.delete(providerId);

            dispatch(
                actions.connectionChanged({
                    providerId,
                    connection: { status: "not connected" }
                })
            );

            const { revokeTokens } = gitProvider.ui.oauth;

            if (revokeTokens === undefined || session === undefined) {
                return;
            }

            try {
                await revokeTokens({ refreshToken: session.refreshToken });
            } catch {
                // NOTE: Signed out locally anyway, the grant can still be revoked on
                // the provider.
            }
        },
    /**
     * PAT providers only. The token is checked (getUser) before being saved: when the
     * provider rejects it, nothing is saved.
     */
    setPersonalAccessToken:
        (params: { providerId: string; personalAccessToken: string }) =>
        async (...args): Promise<{ isAccepted: boolean }> => {
            const { providerId } = params;

            const [dispatch] = args;

            const personalAccessToken = params.personalAccessToken.trim();

            const gitProvider = dispatch(privateThunks.getGitProvider({ providerId }));

            assert(gitProvider.ui.type === "personal-access-token");

            let user: GitUser;

            try {
                user = await gitProvider.getUser({ accessToken: personalAccessToken });
            } catch (error) {
                if (error instanceof GitProviderUnauthorizedError) {
                    return { isAccepted: false };
                }
                throw error;
            }

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => ({
                        ...gitConfig,
                        personalAccessTokenByProviderId: {
                            ...gitConfig.personalAccessTokenByProviderId,
                            [providerId]: personalAccessToken
                        }
                    })
                })
            );

            dispatch(
                actions.connectionChanged({
                    providerId,
                    connection: { status: "connected", user }
                })
            );

            return { isAccepted: true };
        },
    removePersonalAccessToken:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch] = args;

            assert(
                dispatch(privateThunks.getGitProvider({ providerId })).ui.type ===
                    "personal-access-token"
            );

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => {
                        const { [providerId]: _removed, ...rest } =
                            gitConfig.personalAccessTokenByProviderId;

                        return { ...gitConfig, personalAccessTokenByProviderId: rest };
                    }
                })
            );

            dispatch(
                actions.connectionChanged({
                    providerId,
                    connection: { status: "not connected" }
                })
            );
        },
    setFavoriteProvider:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch] = args;

            // NOTE: Asserts that the provider is configured.
            dispatch(privateThunks.getGitProvider({ providerId }));

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => ({
                        ...gitConfig,
                        favoriteProviderId: providerId
                    })
                })
            );
        }
} satisfies Thunks;

const privateThunks = {
    getGitProvider:
        (params: { providerId: string }) =>
        (...args): GitProvider => {
            const [, , { gitProviders }] = args;

            const gitProvider = gitProviders.find(({ id }) => id === params.providerId);

            assert(gitProvider !== undefined, `No git provider ${params.providerId}`);

            return gitProvider;
        },
    getConnection:
        (params: { providerId: string }) =>
        (...[, getState]): Connection =>
            selectors
                .connections(getState())
                ?.find(({ providerId }) => providerId === params.providerId)
                ?.connection ?? { status: "not connected" },
    /**
     * Copies the former GitHub PAT, once, when gitConfigStr doesn't exist yet.
     * Resolves false when the persisted config can't be read back.
     */
    migrateOrCheckPersistedGitConfig:
        () =>
        async (...args): Promise<boolean> => {
            const [dispatch, getState, { gitProvidersConfig }] = args;

            const { gitConfigStr, githubPersonalAccessToken } =
                userConfigs.selectors.userConfigs(getState());

            if (gitConfigStr !== null) {
                return parseGitConfigStr({ gitConfigStr }) !== undefined;
            }

            const gitConfig_migrated = createMigratedPersistedGitConfig({
                providers: gitProvidersConfig.providers,
                githubPersonalAccessToken
            });

            if (gitConfig_migrated !== undefined) {
                await dispatch(
                    userConfigs.thunks.changeValue({
                        key: "gitConfigStr",
                        value: serializeGitConfig({ gitConfig: gitConfig_migrated })
                    })
                );
            }

            return true;
        },
    restoreConnection:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch, getState, { gitSessionStore }] = args;

            const gitProvider = dispatch(privateThunks.getGitProvider({ providerId }));

            const hasCredentials = (() => {
                switch (gitProvider.ui.type) {
                    case "oauth":
                        return gitSessionStore.get({ providerId }) !== undefined;
                    case "personal-access-token":
                        return (
                            protectedSelectors.persistedGitConfig(getState())
                                .personalAccessTokenByProviderId[providerId] !== undefined
                        );
                }
            })();

            if (!hasCredentials) {
                return;
            }

            dispatch(
                actions.connectionChanged({
                    providerId,
                    connection: { status: "connecting" }
                })
            );

            let user: GitUser;

            try {
                user = await dispatch(
                    privateThunks.callWithAccessToken({
                        providerId,
                        call: accessToken => gitProvider.getUser({ accessToken })
                    })
                );
            } catch {
                // NOTE: A rejected token has already been reported as such.
                if (
                    dispatch(privateThunks.getConnection({ providerId })).status !==
                    "error"
                ) {
                    dispatch(
                        actions.connectionChanged({
                            providerId,
                            connection: { status: "error", reason: "loading failed" }
                        })
                    );
                }
                return;
            }

            dispatch(
                actions.connectionChanged({
                    providerId,
                    connection: { status: "connected", user }
                })
            );
        },
    /**
     * Calls the provider with the PAT or the OAuth access token. For OAuth, a 401
     * refreshes the access token and retries, once. A rejected PAT or refresh token is
     * reported in the connection of the provider.
     */
    callWithAccessToken:
        <T>(params: { providerId: string; call: (accessToken: string) => Promise<T> }) =>
        async (...args): Promise<T> => {
            const { providerId, call } = params;

            const [dispatch, getState] = args;

            const gitProvider = dispatch(privateThunks.getGitProvider({ providerId }));

            switch (gitProvider.ui.type) {
                case "personal-access-token": {
                    const personalAccessToken =
                        protectedSelectors.persistedGitConfig(getState())
                            .personalAccessTokenByProviderId[providerId];

                    assert(
                        personalAccessToken !== undefined,
                        `No personal access token for ${providerId}`
                    );

                    try {
                        return await call(personalAccessToken);
                    } catch (error) {
                        if (error instanceof GitProviderUnauthorizedError) {
                            dispatch(
                                actions.connectionChanged({
                                    providerId,
                                    connection: {
                                        status: "error",
                                        reason: "personal access token rejected"
                                    }
                                })
                            );
                        }
                        throw error;
                    }
                }
                case "oauth": {
                    const accessToken = await dispatch(
                        privateThunks.getOAuthAccessToken({
                            providerId,
                            doForceRefresh: false
                        })
                    );

                    try {
                        return await call(accessToken);
                    } catch (error) {
                        if (!(error instanceof GitProviderUnauthorizedError)) {
                            throw error;
                        }
                    }

                    return call(
                        await dispatch(
                            privateThunks.getOAuthAccessToken({
                                providerId,
                                doForceRefresh: true
                            })
                        )
                    );
                }
            }
        },
    /**
     * The access token in memory, or a new one obtained with the refresh token.
     * Refreshes are deduplicated within the tab (a Map of promises) and across tabs
     * (GitSessionStore.runExclusive): a refresh token is single use.
     */
    getOAuthAccessToken:
        (params: { providerId: string; doForceRefresh: boolean }) =>
        async (...args): Promise<string> => {
            const { providerId, doForceRefresh } = params;

            const [dispatch, , { gitSessionStore }] = args;

            if (!doForceRefresh) {
                const cached = globalContext.oauthAccessTokenByProviderId.get(providerId);

                if (
                    cached !== undefined &&
                    cached.expirationTime - ACCESS_TOKEN_EXPIRATION_MARGIN_MS > Date.now()
                ) {
                    return cached.accessToken;
                }
            }

            {
                const prRefresh = globalContext.prRefreshByProviderId.get(providerId);

                if (prRefresh !== undefined) {
                    return prRefresh;
                }
            }

            const gitProvider = dispatch(privateThunks.getGitProvider({ providerId }));

            assert(gitProvider.ui.type === "oauth");

            const { oauth } = gitProvider.ui;

            const prRefresh = gitSessionStore.runExclusive({
                providerId,
                callback: async () => {
                    // NOTE: Read under the lock, another tab may have rotated it.
                    const session = gitSessionStore.get({ providerId });

                    if (session === undefined) {
                        throw new GitProviderUnauthorizedError(
                            "No Git session, signed out from another tab"
                        );
                    }

                    const tokens = await oauth.refreshTokens({
                        refreshToken: session.refreshToken
                    });

                    if (tokens.refreshToken !== undefined) {
                        gitSessionStore.set({
                            providerId,
                            refreshToken: tokens.refreshToken
                        });
                    }

                    globalContext.oauthAccessTokenByProviderId.set(providerId, {
                        accessToken: tokens.accessToken,
                        expirationTime: tokens.expirationTime
                    });

                    return tokens.accessToken;
                }
            });

            globalContext.prRefreshByProviderId.set(providerId, prRefresh);

            try {
                return await prRefresh;
            } catch (error) {
                if (error instanceof GitProviderUnauthorizedError) {
                    gitSessionStore.remove({ providerId });
                    globalContext.oauthAccessTokenByProviderId.delete(providerId);

                    dispatch(
                        actions.connectionChanged({
                            providerId,
                            connection: { status: "error", reason: "session expired" }
                        })
                    );
                }
                throw error;
            } finally {
                globalContext.prRefreshByProviderId.delete(providerId);
            }
        },
    /** Serialized: each write starts from what the previous one saved. */
    mutatePersistedGitConfig:
        (params: { mutate: (gitConfig: PersistedGitConfig) => PersistedGitConfig }) =>
        async (...args): Promise<void> => {
            const { mutate } = params;

            const [dispatch, getState] = args;

            await globalContext.mutex.runExclusive(() =>
                dispatch(
                    userConfigs.thunks.changeValue({
                        key: "gitConfigStr",
                        value: serializeGitConfig({
                            gitConfig: mutate(
                                protectedSelectors.persistedGitConfig(getState())
                            )
                        })
                    })
                )
            );
        }
} satisfies Thunks;

const globalContext = {
    prLoad: id<Promise<void> | undefined>(undefined),
    /** In memory only, the refresh tokens are in the GitSessionStore */
    oauthAccessTokenByProviderId: new Map<
        string,
        { accessToken: string; expirationTime: number }
    >(),
    prRefreshByProviderId: new Map<string, Promise<string>>(),
    mutex: new Mutex()
};
