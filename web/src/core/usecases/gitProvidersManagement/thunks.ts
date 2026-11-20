import type { Thunks } from "core/bootstrap";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { exclude } from "tsafe/exclude";
import { Mutex } from "async-mutex";
import { AccessError } from "clean-architecture";
import {
    GitProviderUnauthorizedError,
    OAuthAuthorizationError,
    type GitProvider,
    type GitRepository,
    type GitUser
} from "core/ports/GitProvider";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import * as userConfigs from "core/usecases/userConfigs";
import * as userAuthentication from "core/usecases/userAuthentication";
import { actions, type Connection, type GitProviderEntry } from "./state";
import { protectedSelectors, selectors } from "./selectors";
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
import { getRepositoryFullPath } from "./decoupledLogic/repositoryUrl";
import {
    createUserProvider,
    getUserProviderConfig,
    type UserProviderCreationError
} from "./decoupledLogic/userProviders";
import { Deferred } from "evt/tools/Deferred";

/** An access token this close to its expiration is refreshed before being used */
const ACCESS_TOKEN_EXPIRATION_MARGIN_MS = 60_000;

const DAY_MS = 24 * 3600_000;

/** GitLab refuses an expiration date further than 365 days from today */
const SCOPED_ACCESS_TOKEN_MAX_LIFETIME_DAYS = 365;

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

            const [, , { gitProvidersConfig }] = args;

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
                const { userProviders } =
                    protectedSelectors.persistedGitConfig(getState());

                const providers = [
                    ...gitProvidersConfig.providers.map(config => ({
                        config,
                        isAddedByUser: false
                    })),
                    ...(gitProvidersConfig.disallowUserToAddProviders
                        ? []
                        : userProviders
                    ).map(userProvider => ({
                        config: getUserProviderConfig({ userProvider }),
                        isAddedByUser: true
                    }))
                ].map(({ config, isAddedByUser }) =>
                    dispatch(
                        privateThunks.createGitProviderEntry({ config, isAddedByUser })
                    )
                );

                const providerIds = providers.map(({ config }) => config.id);

                dispatch(
                    actions.loaded({
                        description: gitProvidersConfig.description,
                        providers,
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
     * personal access tokens and the providers added by the user it held are lost.
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
     * The branches of a repository picked or pasted in the launcher, from its clone url.
     * Empty when the url isn't one of this provider's repositories.
     */
    listBranches:
        (params: {
            providerId: string;
            repositoryUrl: string;
            search: string;
            signal?: AbortSignal;
        }) =>
        async (...args): Promise<string[]> => {
            const { providerId, repositoryUrl, search, signal } = params;

            const [dispatch] = args;

            const { gitProvider, config } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

            const repositoryFullPath = getRepositoryFullPath({
                providerUrl: config.url,
                repositoryUrl
            });

            if (repositoryFullPath === undefined) {
                return [];
            }

            const { branches } = await dispatch(
                privateThunks.callWithAccessToken({
                    providerId,
                    call: accessToken =>
                        gitProvider.listBranches({
                            accessToken,
                            repositoryFullPath,
                            search,
                            signal
                        })
                })
            );

            return branches;
        },
    /**
     * The connected provider a repository url belongs to (a url pasted in the launcher).
     * Several providers on the same url (ui oauth and PAT, say): the first.
     * undefined: none.
     */
    getConnectedProviderIdOfRepositoryUrl:
        (params: { url: string }) =>
        (...[, getState]): string | undefined => {
            const url = params.url.trim();

            return selectors
                .connectedProviders(getState())
                ?.find(provider => url.startsWith(`${provider.url}/`))?.providerId;
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

            const [dispatch, getState] = args;

            const { gitProvider } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

            const { userConnection } = gitProvider;

            assert(userConnection.method === "oauth");

            // NOTE: No await before this call, see GitProvider.OAuth.signIn.
            const prTokens = userConnection.signIn();

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
                const tokens = await prTokens;

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
                    connection: {
                        status: "connected",
                        user,
                        personalAccessTokenExpirationTime: undefined
                    }
                })
            );
        },
    /**
     * OAuth providers only. Revokes the grant when the provider supports it. When it
     * doesn't, or the revocation fails, the user has to revoke it on the provider
     * (authorizedApplicationsUrl): isGrantRevoked is false. Signed out locally anyway.
     */
    signOut:
        (params: { providerId: string }) =>
        async (...args): Promise<{ isGrantRevoked: boolean }> => {
            const { providerId } = params;

            const [dispatch] = args;

            const { gitProvider } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

            const { userConnection } = gitProvider;

            assert(userConnection.method === "oauth");

            // NOTE: Drops the session right away, the revocation goes on.
            const prSignOut = userConnection.signOut();

            globalContext.oauthAccessTokenByProviderId.delete(providerId);

            dispatch(
                actions.connectionChanged({
                    providerId,
                    connection: { status: "not connected" }
                })
            );

            return prSignOut;
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

            const personalAccessTokenExpirationTime =
                await getPersonalAccessTokenExpirationTime({
                    gitProvider,
                    personalAccessToken
                });

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
                    connection: {
                        status: "connected",
                        user,
                        personalAccessTokenExpirationTime
                    }
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

            const [dispatch, getState, { gitProvidersConfig }] = args;

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

            // NOTE: A previous attempt with the same url may have been of another type.
            globalContext.gitProviderByProviderId.delete(userProvider.id);

            const provider = dispatch(
                privateThunks.createGitProviderEntry({
                    config: getUserProviderConfig({ userProvider }),
                    isAddedByUser: true
                })
            );

            const gitProvider = dispatch(
                privateThunks.getGitProviderAdapter({ config: provider.config })
            );

            let user: GitUser;

            try {
                user = await gitProvider.getUser({ accessToken: personalAccessToken });
            } catch (error) {
                return {
                    isSuccess: false,
                    error:
                        error instanceof GitProviderUnauthorizedError
                            ? "personal access token rejected"
                            : "provider unreachable"
                };
            }

            const personalAccessTokenExpirationTime =
                await getPersonalAccessTokenExpirationTime({
                    gitProvider,
                    personalAccessToken
                });

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
                actions.providerAdded({
                    provider,
                    connection: {
                        status: "connected",
                        user,
                        personalAccessTokenExpirationTime
                    }
                })
            );

            return { isSuccess: true, providerId: userProvider.id };
        },
    /**
     * A provider the user added, edited. personalAccessToken undefined: the saved one is
     * kept, it must then be the same provider (type and url). Nothing is saved unless the
     * provider accepts the new token.
     */
    updateUserProvider:
        (params: {
            providerId: string;
            type: GitProvidersConfig.ProviderType;
            url: string;
            /** Empty: the host of the url */
            displayName: string;
            personalAccessToken: string | undefined;
        }) =>
        async (
            ...args
        ): Promise<
            | { isSuccess: true; providerId: string }
            | { isSuccess: false; error: UpdateUserProviderError }
        > => {
            const { providerId, type, url, displayName } = params;

            const [dispatch, getState, { gitProvidersConfig }] = args;

            assert(selectors.stateDescription(getState()) === "ready");

            const persistedGitConfig = protectedSelectors.persistedGitConfig(getState());

            const userProvider_before = persistedGitConfig.userProviders.find(
                ({ id }) => id === providerId
            );

            assert(userProvider_before !== undefined, `No user provider ${providerId}`);

            const result = createUserProvider({
                type,
                url,
                displayName,
                gitProvidersConfig,
                // NOTE: Its own url isn't "already configured".
                userProviders: persistedGitConfig.userProviders.filter(
                    ({ id }) => id !== providerId
                )
            });

            if (!result.isSuccess) {
                return result;
            }

            const { userProvider } = result;

            // NOTE: The url with its scheme, not the id: the saved token isn't sent
            // over http when it was given for https.
            const isSameProvider =
                userProvider.url === userProvider_before.url &&
                userProvider.type === userProvider_before.type;

            const personalAccessToken_new = (() => {
                const value = params.personalAccessToken?.trim();

                return value === "" ? undefined : value;
            })();

            if (personalAccessToken_new === undefined && !isSameProvider) {
                return { isSuccess: false, error: "personal access token required" };
            }

            const personalAccessToken =
                personalAccessToken_new ??
                persistedGitConfig.personalAccessTokenByProviderId[providerId];

            globalContext.gitProviderByProviderId.delete(providerId);
            globalContext.gitProviderByProviderId.delete(userProvider.id);

            const provider = dispatch(
                privateThunks.createGitProviderEntry({
                    config: getUserProviderConfig({ userProvider }),
                    isAddedByUser: true
                })
            );

            let connection: Connection;

            if (personalAccessToken_new === undefined) {
                // NOTE: Only the name changed, the connection is the same.
                connection = dispatch(privateThunks.getConnection({ providerId }));
            } else {
                const gitProvider = dispatch(
                    privateThunks.getGitProviderAdapter({ config: provider.config })
                );

                let user: GitUser;

                try {
                    user = await gitProvider.getUser({
                        accessToken: personalAccessToken_new
                    });
                } catch (error) {
                    return {
                        isSuccess: false,
                        error:
                            error instanceof GitProviderUnauthorizedError
                                ? "personal access token rejected"
                                : "provider unreachable"
                    };
                }

                connection = {
                    status: "connected",
                    user,
                    personalAccessTokenExpirationTime:
                        await getPersonalAccessTokenExpirationTime({
                            gitProvider,
                            personalAccessToken: personalAccessToken_new
                        })
                };
            }

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => {
                        const { [providerId]: _removed, ...rest } =
                            gitConfig.personalAccessTokenByProviderId;

                        return {
                            ...gitConfig,
                            personalAccessTokenByProviderId:
                                personalAccessToken === undefined
                                    ? rest
                                    : { ...rest, [userProvider.id]: personalAccessToken },
                            userProviders: gitConfig.userProviders.map(userProvider_i =>
                                userProvider_i.id === providerId
                                    ? userProvider
                                    : userProvider_i
                            )
                        };
                    }
                })
            );

            dispatch(
                actions.providerUpdated({
                    providerId_before: providerId,
                    provider,
                    connection
                })
            );

            return { isSuccess: true, providerId: userProvider.id };
        },
    /** A provider the user added, with its token. */
    removeUserProvider:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch, getState] = args;

            assert(
                (protectedSelectors.providers(getState()) ?? []).some(
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
                            userProviders: gitConfig.userProviders.filter(
                                ({ id }) => id !== providerId
                            )
                        };
                    }
                })
            );

            dispatch(actions.providerRemoved({ providerId }));

            globalContext.gitProviderByProviderId.delete(providerId);
        },
    /**
     * `.git` of the XOnyxia context, called when the launcher opens. Loads the use case
     * if that hasn't happened yet.
     * - git.providers: the connected providers, see getProvidersContext.
     * - git.enabled: at least one Git provider is connected.
     * - The deprecated single forge fields (name, email, token): the primary provider's
     *   (see selectors.primaryProviderId), the Onyxia (Keycloak) account's when nothing
     *   is connected or the integration is disabled.
     * - What is created at launch is a marker, replaced by getServiceGitCredentials.
     */
    getGitContext:
        () =>
        async (...args): Promise<XOnyxiaContext["git"]> => {
            const [dispatch, getState] = args;

            const { gitCredentialCacheDuration } =
                userConfigs.selectors.userConfigs(getState());

            const identity_onyxia = dispatch(privateThunks.getOnyxiaIdentity());

            // NOTE: Does nothing when the integration is disabled, never ready then.
            await dispatch(thunks.load());

            if (selectors.stateDescription(getState()) !== "ready") {
                return {
                    enabled: false,
                    providers: [],
                    ...identity_onyxia,
                    credentials_cache_duration: gitCredentialCacheDuration,
                    token: undefined
                };
            }

            const providers = dispatch(privateThunks.getProvidersContext());

            const primaryProviderId = selectors.primaryProviderId(getState());

            const primary = providers.find(({ id }) => id === primaryProviderId);

            return {
                enabled: providers.length !== 0,
                providers,
                name: primary?.user.name ?? identity_onyxia.name,
                email: primary?.user.email ?? identity_onyxia.email,
                credentials_cache_duration: gitCredentialCacheDuration,
                token: (() => {
                    if (primary === undefined) {
                        return undefined;
                    }

                    switch (primary.credentials?.type) {
                        case "token":
                            return primary.credentials.token;
                        case "oauth":
                            // NOTE: The access token of the service's authorization, enough
                            // for the first clone with the current images. None with the
                            // device flow (GitHub).
                            return primary.credentials.refreshToken === undefined
                                ? undefined
                                : createServiceCredentialsMarker({
                                      kind: "access-token",
                                      providerId: primary.id
                                  });
                        case undefined:
                            return undefined;
                    }
                })()
            };
        },
    /**
     * Whether getServiceGitCredentials opens the OAuth authorization popup for these
     * markers. It needs a click: an automatic launch can't do it.
     */
    getIsServiceAuthorizationPopupRequired:
        (params: { markers: string[] }) =>
        (...args): boolean => {
            const [dispatch, getState] = args;

            const providerIds = new Set(
                (protectedSelectors.providers(getState()) ?? []).map(
                    ({ config }) => config.id
                )
            );

            return params.markers
                .map(parseServiceCredentialsMarker)
                .filter(exclude(undefined))
                .some(
                    ({ providerId }) =>
                        providerIds.has(providerId) &&
                        dispatch(privateThunks.getGitProvider({ providerId })).gitProvider
                            .serviceCredentials.method === "oauth"
                );
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

            const [dispatch] = args;

            const providerIds = [
                ...new Set(
                    params.markers
                        .map(parseServiceCredentialsMarker)
                        .filter(exclude(undefined))
                        .map(({ providerId }) => providerId)
                )
            ];

            const isOAuthByProviderIndex = providerIds.map(
                providerId =>
                    dispatch(privateThunks.getGitProvider({ providerId })).gitProvider
                        .serviceCredentials.method === "oauth"
            );

            /**
             * The tokens are only created once every authorization (popup) went through:
             * the user may deny or close one, a token created meanwhile would be lost.
             */
            const dAreAuthorizationsGranted = new Deferred<boolean>();

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

                            let tokens: GitProvider.ServiceTokens;

                            try {
                                tokens = await authorizeAtLaunch.authorize();
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

                            return {
                                isSuccess: true,
                                valueByKind: {
                                    "access-token": tokens.accessToken,
                                    "refresh-token": tokens.refreshToken
                                }
                            };
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

                            if (!(await dAreAuthorizationsGranted.pr)) {
                                // NOTE: The launch fails on the authorization error.
                                return { isSuccess: true, valueByKind: {} };
                            }

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

            Promise.all(prResults.filter((_, i) => isOAuthByProviderIndex[i])).then(
                results =>
                    dAreAuthorizationsGranted.resolve(
                        results.every(({ isSuccess }) => isSuccess)
                    ),
                () => dAreAuthorizationsGranted.resolve(false)
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

/** personal access token required: the provider changed, its token can't be kept */
export type UpdateUserProviderError =
    | AddUserProviderError
    | "personal access token required";

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
     * - oauth: the helper config, and a marker for the refresh token Onyxia gets at
     *   launch (one popup, shared by the providers). Without an authorization at launch
     *   (GitHub), only when the provider has a device flow.
     */
    getProvidersContext:
        () =>
        (...args): XOnyxiaContext["git"]["providers"] => {
            const [dispatch, getState] = args;

            const connections = selectors.connections(getState());

            assert(connections !== undefined);

            const identity_onyxia = dispatch(privateThunks.getOnyxiaIdentity());

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
                                            authorizeAtLaunch !== undefined
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

                                        // NOTE: GitLab takes a date and expires the token
                                        // at 00:00 UTC that day: the time advertised
                                        // to the service is that midnight. The day after
                                        // today + lifetimeDays, so that the token lasts
                                        // at least lifetimeDays, within GitLab's 365 days.
                                        const expirationTime =
                                            Math.floor(Date.now() / DAY_MS) * DAY_MS +
                                            Math.min(
                                                config.authentication.service
                                                    .lifetimeDays + 1,
                                                SCOPED_ACCESS_TOKEN_MAX_LIFETIME_DAYS
                                            ) *
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
    /** The provider, of the state, with its adapter. The use case must be loaded. */
    getGitProvider:
        (params: { providerId: string }) =>
        (
            ...args
        ): GitProviderEntry & {
            gitProvider: GitProvider;
        } => {
            const [dispatch, getState] = args;

            const entry = protectedSelectors
                .providers(getState())
                ?.find(({ config }) => config.id === params.providerId);

            assert(entry !== undefined, `No git provider ${params.providerId}`);

            return {
                ...entry,
                gitProvider: dispatch(
                    privateThunks.getGitProviderAdapter({ config: entry.config })
                )
            };
        },
    /** The adapters are kept out of the state, created once per provider */
    getGitProviderAdapter:
        (params: { config: GitProvidersConfig.Provider }) =>
        (...args): GitProvider => {
            const { config } = params;

            const [, , { createGitProvider }] = args;

            let gitProvider = globalContext.gitProviderByProviderId.get(config.id);

            if (gitProvider === undefined) {
                gitProvider = createGitProvider({ config });
                globalContext.gitProviderByProviderId.set(config.id, gitProvider);
            }

            return gitProvider;
        },
    /** What the state keeps of a provider, see GitProviderEntry */
    createGitProviderEntry:
        (params: { config: GitProvidersConfig.Provider; isAddedByUser: boolean }) =>
        (...args): GitProviderEntry => {
            const { config, isAddedByUser } = params;

            const [dispatch] = args;

            const { userConnection } = dispatch(
                privateThunks.getGitProviderAdapter({ config })
            );

            return {
                config,
                isAddedByUser,
                userConnection: (() => {
                    switch (userConnection.method) {
                        case "oauth":
                            return {
                                method: "oauth",
                                authorizedApplicationsUrl:
                                    userConnection.authorizedApplicationsUrl
                            };
                        case "personal-access-token":
                            return {
                                method: "personal-access-token",
                                tokenCreationUrl: userConnection.tokenCreationUrl
                            };
                    }
                })()
            };
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

            const [dispatch, getState] = args;

            const { gitProvider } = dispatch(
                privateThunks.getGitProvider({ providerId })
            );

            const hasCredentials = (() => {
                switch (gitProvider.userConnection.method) {
                    case "oauth":
                        return gitProvider.userConnection.hasSession();
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

            const personalAccessTokenExpirationTime =
                await getPersonalAccessTokenExpirationTime({
                    gitProvider,
                    personalAccessToken:
                        protectedSelectors.persistedGitConfig(getState())
                            .personalAccessTokenByProviderId[providerId]
                });

            dispatch(
                actions.connectionChanged({
                    providerId,
                    connection: {
                        status: "connected",
                        user,
                        personalAccessTokenExpirationTime
                    }
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

            const [dispatch] = args;

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

            const prRefresh = userConnection.refreshTokens().then(tokens => {
                globalContext.oauthAccessTokenByProviderId.set(providerId, tokens);

                return tokens.accessToken;
            });

            globalContext.prRefreshByProviderId.set(providerId, prRefresh);

            try {
                return await prRefresh;
            } catch (error) {
                if (error instanceof GitProviderUnauthorizedError) {
                    // NOTE: The provider has dropped the session.
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

/**
 * Only informative: not being able to read it (older GitLab, missing scope) isn't a
 * reason not to connect, and a 401 here says nothing about the token's other uses.
 */
async function getPersonalAccessTokenExpirationTime(params: {
    gitProvider: GitProvider;
    personalAccessToken: string | undefined;
}): Promise<number | undefined> {
    const { gitProvider, personalAccessToken } = params;

    const { userConnection } = gitProvider;

    if (
        personalAccessToken === undefined ||
        userConnection.method !== "personal-access-token" ||
        userConnection.getTokenExpirationTime === undefined
    ) {
        return undefined;
    }

    try {
        return await userConnection.getTokenExpirationTime({
            accessToken: personalAccessToken
        });
    } catch {
        return undefined;
    }
}

const globalContext = {
    prLoad: id<Promise<void> | undefined>(undefined),
    /** In memory only, the refresh tokens are in the GitSessionStore */
    oauthAccessTokenByProviderId: new Map<
        string,
        { accessToken: string; expirationTime: number }
    >(),
    prRefreshByProviderId: new Map<string, Promise<string>>(),
    mutex: new Mutex(),
    /** The adapters, out of the state, see getGitProviderAdapter */
    gitProviderByProviderId: new Map<string, GitProvider>(),
    /** The one announced in the XOnyxia context, the token is created with it at launch */
    scopedAccessTokenExpirationTimeByProviderId: new Map<string, number>()
};
