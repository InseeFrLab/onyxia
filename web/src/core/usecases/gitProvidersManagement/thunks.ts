import type { Thunks } from "core/bootstrap";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { exclude } from "tsafe/exclude";
import { Mutex } from "async-mutex";
import { AccessError } from "clean-architecture";
import {
    GitProviderUnauthorizedError,
    type GitRepository,
    type GitUser
} from "core/ports/GitProvider";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import { OAuthAuthorizationError } from "core/ports/OAuthAuthorization";
import * as userConfigs from "core/usecases/userConfigs";
import * as userAuthentication from "core/usecases/userAuthentication";
import { actions, type Connection } from "./state";
import { protectedSelectors, selectors, type GitProviderEntry } from "./selectors";
import {
    createEmptyPersistedGitConfig,
    createMigratedPersistedGitConfig,
    parseGitConfigStr,
    serializeGitConfig,
    type PersistedGitConfig
} from "./decoupledLogic/persistedGitConfig";
import {
    createServiceCredentialsMarker,
    parseServiceCredentialsMarker,
    type ServiceCredentialsMarker
} from "./decoupledLogic/serviceCredentialsMarkers";
import {
    createUserProvider,
    getUserProviderConfig,
    type UserProviderCreationError
} from "./decoupledLogic/userProviders";

/** An access token this close to its expiration is refreshed before being used */
const ACCESS_TOKEN_EXPIRATION_MARGIN_MS = 60_000;

const DAY_MS = 24 * 3600_000;

export const thunks = {
    /** There are providers in GIT_PROVIDERS, or the users can add theirs */
    isAvailable:
        () =>
        (...args): boolean => {
            const [, , { gitProvidersConfig, oidc }] = args;

            return (
                (gitProvidersConfig.providers.length !== 0 ||
                    !gitProvidersConfig.disallowUserToAddProviders) &&
                oidc.isUserLoggedIn
            );
        },
    canUserAddProviders:
        () =>
        (...args): boolean => {
            const [dispatch, , { gitProvidersConfig }] = args;

            return (
                dispatch(thunks.isAvailable()) &&
                !gitProvidersConfig.disallowUserToAddProviders
            );
        },
    /**
     * Idempotent, and safe to call concurrently: both the account tab and the launcher
     * ask for it, whoever comes second waits for the first instead of starting over.
     * Restores the OAuth sessions and checks the saved PATs.
     */
    load:
        () =>
        async (...args): Promise<void> => {
            const [dispatch, getState] = args;

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

                // NOTE: Read after the migration, it may have added github.com.
                const providerIds = protectedSelectors
                    .gitProviders(getState())
                    .map(({ config }) => config.id);

                dispatch(
                    actions.loaded({
                        connectionByProviderId: Object.fromEntries(
                            providerIds.map(providerId => [
                                providerId,
                                id<Connection>({ status: "not connected" })
                            ])
                        )
                    })
                );

                await Promise.all(
                    providerIds.map(providerId =>
                        dispatch(privateThunks.restoreConnection({ providerId }))
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

            const { gitProvider } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

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

            const { gitProvider } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

            const { userConnection } = gitProvider;

            assert(userConnection.method === "oauth");

            const { redirectUri } = oauthAuthorization;

            // NOTE: No await before this call, see OAuthAuthorization.authorizeInPopup.
            const prAuthorization = oauthAuthorization.authorizeInPopup({
                getAuthorizationUrl: ({ state, codeChallenge }) =>
                    userConnection.getAuthorizationUrl({
                        redirectUri,
                        state,
                        codeChallenge
                    })
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

                const tokens = await userConnection.exchangeAuthorizationCode({
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
     * OAuth providers only. Revokes the grant when the provider supports it. When it
     * doesn't, or the revocation fails, the user has to revoke it on the provider
     * (authorizedApplicationsUrl): isGrantRevoked is false. Signed out locally anyway.
     * The favorite provider doesn't change.
     */
    signOut:
        (params: { providerId: string }) =>
        async (...args): Promise<{ isGrantRevoked: boolean }> => {
            const { providerId } = params;

            const [dispatch, , { gitSessionStore }] = args;

            const { gitProvider } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

            const { userConnection } = gitProvider;

            assert(userConnection.method === "oauth");

            const session = gitSessionStore.get({ providerId });

            gitSessionStore.remove({ providerId });
            globalContext.oauthAccessTokenByProviderId.delete(providerId);

            dispatch(
                actions.connectionChanged({
                    providerId,
                    connection: { status: "not connected" }
                })
            );

            const { revokeTokens } = userConnection;

            if (revokeTokens === undefined || session === undefined) {
                return { isGrantRevoked: false };
            }

            try {
                await revokeTokens({ refreshToken: session.refreshToken });
            } catch {
                return { isGrantRevoked: false };
            }

            return { isGrantRevoked: true };
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

            const { gitProvider } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

            assert(gitProvider.userConnection.method === "personal-access-token");

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
                dispatch(privateThunks.getGitProvider({ providerId })).gitProvider
                    .userConnection.method === "personal-access-token"
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
    /**
     * A provider of the user's own (gitlab.com, github.com...), always with a personal
     * access token. Nothing is saved unless the provider accepts the token: a wrong url
     * or type, or a provider that doesn't allow CORS (Forgejo without [cors] ENABLED),
     * is "provider unreachable".
     */
    addUserProvider:
        (params: {
            type: GitProvidersConfig.ProviderType;
            url: string;
            /** Empty: the host of the url */
            displayName: string;
            personalAccessToken: string;
        }) =>
        async (
            ...args
        ): Promise<
            | { isSuccess: true; providerId: string }
            | { isSuccess: false; error: AddUserProviderError }
        > => {
            const { type, url, displayName } = params;

            const [dispatch, getState, { gitProvidersConfig, createGitProvider }] = args;

            assert(dispatch(thunks.canUserAddProviders()));
            assert(selectors.stateDescription(getState()) === "ready");

            const personalAccessToken = params.personalAccessToken.trim();

            const result = createUserProvider({
                type,
                url,
                displayName,
                gitProvidersConfig,
                userProviders:
                    protectedSelectors.persistedGitConfig(getState()).userProviders
            });

            if (!result.isSuccess) {
                return result;
            }

            const { userProvider } = result;

            let user: GitUser;

            try {
                user = await createGitProvider({
                    config: getUserProviderConfig({ userProvider })
                }).getUser({ accessToken: personalAccessToken });
            } catch (error) {
                return {
                    isSuccess: false,
                    error:
                        error instanceof GitProviderUnauthorizedError
                            ? "personal access token rejected"
                            : "provider unreachable"
                };
            }

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => ({
                        ...gitConfig,
                        personalAccessTokenByProviderId: {
                            ...gitConfig.personalAccessTokenByProviderId,
                            [userProvider.id]: personalAccessToken
                        },
                        userProviders: [
                            ...gitConfig.userProviders.filter(
                                ({ id }) => id !== userProvider.id
                            ),
                            userProvider
                        ]
                    })
                })
            );

            dispatch(
                actions.connectionChanged({
                    providerId: userProvider.id,
                    connection: { status: "connected", user }
                })
            );

            return { isSuccess: true, providerId: userProvider.id };
        },
    /** A provider the user added, with its token. It is no longer the favorite. */
    removeUserProvider:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch, getState] = args;

            assert(
                protectedSelectors
                    .gitProviders(getState())
                    .some(
                        ({ config, isAddedByUser }) =>
                            isAddedByUser && config.id === providerId
                    )
            );

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => {
                        const { [providerId]: _removed, ...rest } =
                            gitConfig.personalAccessTokenByProviderId;

                        return {
                            personalAccessTokenByProviderId: rest,
                            favoriteProviderId:
                                gitConfig.favoriteProviderId === providerId
                                    ? null
                                    : gitConfig.favoriteProviderId,
                            userProviders: gitConfig.userProviders.filter(
                                ({ id }) => id !== providerId
                            )
                        };
                    }
                })
            );

            dispatch(actions.providerRemoved({ providerId }));
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
        },
    /**
     * `.git` of the XOnyxia context, called when the launcher opens. Loads the use case
     * if that hasn't happened yet.
     * - git.providers: the connected providers, see getProvidersContext.
     * - git.enabled: at least one Git provider is connected (always true when the
     *   integration is disabled, as before).
     * - The deprecated single forge fields (name, email, token): the favorite's, the
     *   Onyxia (Keycloak) account's when nothing is connected. The former name / email
     *   fields are only used when the integration is disabled.
     * - What is created at launch is a marker, replaced by getServiceGitCredentials.
     *
     * TODO(phase 3): repositories.
     */
    getGitContext:
        () =>
        async (...args): Promise<XOnyxiaContext["git"]> => {
            const [dispatch, getState] = args;

            const {
                gitName,
                gitEmail,
                gitCredentialCacheDuration,
                githubPersonalAccessToken
            } = userConfigs.selectors.userConfigs(getState());

            const token_legacy = githubPersonalAccessToken ?? undefined;

            if (!dispatch(thunks.isAvailable())) {
                return {
                    enabled: true,
                    providers: [],
                    name: gitName,
                    email: gitEmail,
                    credentials_cache_duration: gitCredentialCacheDuration,
                    token: token_legacy
                };
            }

            const identity_onyxia = dispatch(privateThunks.getOnyxiaIdentity());

            await dispatch(thunks.load());

            if (selectors.stateDescription(getState()) !== "ready") {
                return {
                    enabled: false,
                    providers: [],
                    ...identity_onyxia,
                    credentials_cache_duration: gitCredentialCacheDuration,
                    token: token_legacy
                };
            }

            const providers = dispatch(privateThunks.getProvidersContext());

            const favoriteProviderId = selectors.favoriteProviderId(getState());

            const favorite = providers.find(({ id }) => id === favoriteProviderId);

            return {
                enabled: providers.length !== 0,
                providers,
                name: favorite?.user.name ?? identity_onyxia.name,
                email: favorite?.user.email ?? identity_onyxia.email,
                credentials_cache_duration: gitCredentialCacheDuration,
                token: (() => {
                    if (favorite === undefined) {
                        return undefined;
                    }

                    switch (favorite.credentials?.type) {
                        case "token":
                            return favorite.credentials.token;
                        case "oauth":
                            // NOTE: The access token of the service's authorization, enough
                            // for the first clone with the current images. None with the
                            // device flow (GitHub).
                            return favorite.credentials.refreshToken === undefined
                                ? undefined
                                : createServiceCredentialsMarker({
                                      kind: "access-token",
                                      providerId: favorite.id
                                  });
                        case undefined:
                            return undefined;
                    }
                })()
            };
        },
    /**
     * When "Launch" is clicked, the values of the markers left in the helm values (see
     * getGitContext): the tokens are created (scoped-access-token, named
     * onyxia-<serviceName>) and the service is authorized (oauth, popup). No marker
     * left: nothing is created, no popup.
     *
     * Must be dispatched synchronously from the click handler: the popup is opened
     * before anything is awaited. Never rejects.
     */
    getServiceGitCredentials:
        (params: { serviceName: string; markers: string[] }) =>
        async (
            ...args
        ): Promise<
            | { isSuccess: true; valueByMarker: Record<string, string> }
            | { isSuccess: false; error: ServiceGitCredentialsError }
        > => {
            const { serviceName } = params;

            const [dispatch, , { oauthAuthorization }] = args;

            const providerIds = [
                ...new Set(
                    params.markers
                        .map(parseServiceCredentialsMarker)
                        .filter(exclude(undefined))
                        .map(({ providerId }) => providerId)
                )
            ];

            // NOTE: No await before this map, the popups are opened in it.
            const prResults = providerIds.map(
                async (
                    providerId
                ): Promise<
                    | {
                          isSuccess: true;
                          valueByKind: Partial<
                              Record<ServiceCredentialsMarker.Kind, string>
                          >;
                      }
                    | { isSuccess: false; error: ServiceGitCredentialsError }
                > => {
                    const { config, gitProvider } = dispatch(
                        privateThunks.getGitProvider({ providerId })
                    );

                    const createError = (
                        reason: ServiceGitCredentialsError["reason"],
                        detail?: string
                    ) => ({
                        isSuccess: false as const,
                        error: {
                            providerId,
                            providerDisplayName: config.displayName,
                            reason,
                            detail
                        }
                    });

                    const { serviceCredentials } = gitProvider;

                    switch (serviceCredentials.method) {
                        case "oauth": {
                            const { authorizeAtLaunch } = serviceCredentials;

                            assert(authorizeAtLaunch !== undefined);

                            const { redirectUri } = oauthAuthorization;

                            const prAuthorization = oauthAuthorization.authorizeInPopup({
                                getAuthorizationUrl: ({ state, codeChallenge }) =>
                                    authorizeAtLaunch.getAuthorizationUrl({
                                        redirectUri,
                                        state,
                                        codeChallenge
                                    })
                            });

                            let code: string;
                            let codeVerifier: string;

                            try {
                                ({ code, codeVerifier } = await prAuthorization);
                            } catch (error) {
                                if (!(error instanceof OAuthAuthorizationError)) {
                                    return createError("request failed", String(error));
                                }

                                switch (error.reason) {
                                    case "popup blocked":
                                        return createError("popup blocked");
                                    case "denied":
                                        return createError(
                                            "authorization denied",
                                            error.providerError
                                        );
                                    case "popup closed":
                                    case "timeout":
                                        return createError("authorization cancelled");
                                }
                            }

                            try {
                                const tokens =
                                    await authorizeAtLaunch.exchangeAuthorizationCode({
                                        code,
                                        codeVerifier,
                                        redirectUri
                                    });

                                return {
                                    isSuccess: true,
                                    valueByKind: {
                                        "access-token": tokens.accessToken,
                                        "refresh-token": tokens.refreshToken
                                    }
                                };
                            } catch (error) {
                                return createError("request failed", String(error));
                            }
                        }
                        case "scoped-token": {
                            assert(
                                config.authentication.service.type ===
                                    "scoped-access-token"
                            );

                            const expirationTime =
                                globalContext.scopedAccessTokenExpirationTimeByProviderId.get(
                                    providerId
                                ) ??
                                Date.now() +
                                    config.authentication.service.lifetimeDays * DAY_MS;

                            try {
                                // NOTE: Refreshed and retried once when rejected.
                                const { token } = await dispatch(
                                    privateThunks.callWithAccessToken({
                                        providerId,
                                        call: accessToken =>
                                            serviceCredentials.createToken({
                                                accessToken,
                                                name: `onyxia-${serviceName}`,
                                                expirationTime
                                            })
                                    })
                                );

                                return {
                                    isSuccess: true,
                                    valueByKind: { "access-token": token }
                                };
                            } catch (error) {
                                if (
                                    dispatch(privateThunks.getConnection({ providerId }))
                                        .status !== "connected"
                                ) {
                                    return createError("sign in required");
                                }

                                return createError(
                                    "request failed",
                                    error instanceof Error ? error.message : String(error)
                                );
                            }
                        }
                        case "user-token":
                            // NOTE: The PAT is in the context, never a marker.
                            assert(false);
                    }
                }
            );

            const results = await Promise.all(prResults);

            const valueByMarker: Record<string, string> = {};

            for (const [i, result] of results.entries()) {
                if (!result.isSuccess) {
                    return result;
                }

                const providerId = providerIds[i];

                for (const [kind, value] of Object.entries(result.valueByKind)) {
                    valueByMarker[
                        createServiceCredentialsMarker({
                            kind: kind as ServiceCredentialsMarker.Kind,
                            providerId
                        })
                    ] = value;
                }
            }

            return { isSuccess: true, valueByMarker };
        }
} satisfies Thunks;

export type AddUserProviderError =
    | UserProviderCreationError
    | "personal access token rejected"
    | "provider unreachable";

export type ServiceGitCredentialsError = {
    providerId: string;
    providerDisplayName: string;
    /** sign in required: the session expired or the PAT was rejected, see Account → Git */
    reason:
        | "popup blocked"
        | "authorization cancelled"
        | "authorization denied"
        | "sign in required"
        | "request failed";
    /** authorization denied: what the provider said. request failed: the error */
    detail: string | undefined;
};

const privateThunks = {
    /** The user's Onyxia (Keycloak) account, what git.name / git.email used to default to */
    getOnyxiaIdentity:
        () =>
        (...[, getState]): { name: string; email: string } => {
            const authentication = userAuthentication.selectors.main(getState());

            assert(authentication.isUserLoggedIn);

            const { user } = authentication;

            // NOTE: Same defaults as userConfigs, some fields can't be read on mock users.
            const readOrDefault = (read: () => string, defaultValue: string) => {
                try {
                    return read();
                } catch (error) {
                    if (error instanceof AccessError) {
                        return defaultValue;
                    }
                    throw error;
                }
            };

            return {
                name: readOrDefault(() => user.username, "unknown"),
                email: readOrDefault(() => user.email, "unknown@unknown.net")
            };
        },
    /**
     * git.providers: the connected providers, in the order of gitProviders.
     * Identity: the provider's user, the Onyxia (Keycloak) account's for what it doesn't
     * give (private email). Credentials:
     * - personal-access-token: the user's PAT.
     * - scoped-access-token: markers, the token is created at launch.
     * - oauth: the helper config. For the favorite, a marker for the refresh token
     *   Onyxia gets at launch (popup). For the others, nothing: they only get
     *   credentials when the provider has a device flow.
     */
    getProvidersContext:
        () =>
        (...args): XOnyxiaContext["git"]["providers"] => {
            const [dispatch, getState] = args;

            const connections = selectors.connections(getState());

            assert(connections !== undefined);

            const identity_onyxia = dispatch(privateThunks.getOnyxiaIdentity());

            const favoriteProviderId = selectors.favoriteProviderId(getState());

            return connections
                .map(
                    ({
                        providerId,
                        connection
                    }): XOnyxiaContext["git"]["providers"][number] | undefined => {
                        if (connection.status !== "connected") {
                            return undefined;
                        }

                        const { config, gitProvider } = dispatch(
                            privateThunks.getGitProvider({ providerId })
                        );

                        const credentials =
                            ((): XOnyxiaContext["git"]["providers"][number]["credentials"] => {
                                const { serviceCredentials } = gitProvider;

                                switch (serviceCredentials.method) {
                                    case "user-token": {
                                        const personalAccessToken =
                                            protectedSelectors.persistedGitConfig(
                                                getState()
                                            ).personalAccessTokenByProviderId[providerId];

                                        if (personalAccessToken === undefined) {
                                            return undefined;
                                        }

                                        return {
                                            type: "token",
                                            username: gitProvider.getGitUsername({
                                                user: connection.user
                                            }),
                                            token: personalAccessToken,
                                            expirationTime: undefined
                                        };
                                    }
                                    case "oauth": {
                                        const { helperConfig, authorizeAtLaunch } =
                                            serviceCredentials;

                                        const refreshToken =
                                            authorizeAtLaunch !== undefined &&
                                            providerId === favoriteProviderId
                                                ? createServiceCredentialsMarker({
                                                      kind: "refresh-token",
                                                      providerId
                                                  })
                                                : undefined;

                                        if (
                                            refreshToken === undefined &&
                                            helperConfig.deviceAuthorizationUrl ===
                                                undefined
                                        ) {
                                            return undefined;
                                        }

                                        return {
                                            type: "oauth",
                                            ...helperConfig,
                                            refreshToken
                                        };
                                    }
                                    case "scoped-token": {
                                        assert(
                                            config.authentication.service.type ===
                                                "scoped-access-token"
                                        );

                                        const expirationTime =
                                            Date.now() +
                                            config.authentication.service.lifetimeDays *
                                                DAY_MS;

                                        globalContext.scopedAccessTokenExpirationTimeByProviderId.set(
                                            providerId,
                                            expirationTime
                                        );

                                        return {
                                            type: "token",
                                            username: gitProvider.getGitUsername({
                                                user: connection.user
                                            }),
                                            token: createServiceCredentialsMarker({
                                                kind: "access-token",
                                                providerId
                                            }),
                                            expirationTime
                                        };
                                    }
                                }
                            })();

                        return {
                            id: providerId,
                            url: config.url,
                            user: {
                                name: connection.user.name || identity_onyxia.name,
                                email: connection.user.email || identity_onyxia.email
                            },
                            credentials
                        };
                    }
                )
                .filter(exclude(undefined));
        },
    getGitProvider:
        (params: { providerId: string }) =>
        (...[, getState]): GitProviderEntry => {
            const entry = protectedSelectors
                .gitProviders(getState())
                .find(({ config }) => config.id === params.providerId);

            assert(entry !== undefined, `No git provider ${params.providerId}`);

            return entry;
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
                gitProvidersConfig,
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

            const { gitProvider } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

            const hasCredentials = (() => {
                switch (gitProvider.userConnection.method) {
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

            const { gitProvider } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

            switch (gitProvider.userConnection.method) {
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

            const [dispatch, , { gitSessionStore, oauthAuthorization }] = args;

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

            const { gitProvider } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

            const { userConnection } = gitProvider;

            assert(userConnection.method === "oauth");

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

                    const tokens = await userConnection.refreshTokens({
                        refreshToken: session.refreshToken,
                        redirectUri: oauthAuthorization.redirectUri
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
    mutex: new Mutex(),
    /** The one announced in the XOnyxia context, the token is created with it at launch */
    scopedAccessTokenExpirationTimeByProviderId: new Map<string, number>()
};
