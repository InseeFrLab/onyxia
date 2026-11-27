import type { Thunks } from "core/bootstrap";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { exclude } from "tsafe/exclude";
import { Mutex } from "async-mutex";
import { AccessError } from "clean-architecture";
import {
    GitForgeUnauthorizedError,
    OAuthAuthorizationError,
    type GitForge,
    type GitRepository,
    type GitUser
} from "core/ports/GitForge";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";
import * as userConfigs from "core/usecases/userConfigs";
import * as userAuthentication from "core/usecases/userAuthentication";
import { actions, type Connection, type GitForgeEntry } from "./state";
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
    createUserForge,
    getUserForgeConfig,
    type UserForgeCreationError
} from "./decoupledLogic/userForges";
import { Deferred } from "evt/tools/Deferred";

/** An access token this close to its expiration is refreshed before being used */
const ACCESS_TOKEN_EXPIRATION_MARGIN_MS = 60_000;

const DAY_MS = 24 * 3600_000;

/** GitLab refuses an expiration date further than 365 days from today */
const SCOPED_ACCESS_TOKEN_MAX_LIFETIME_DAYS = 365;

export const thunks = {
    /** There are forges in GIT_FORGES, or the users can add theirs */
    isAvailable:
        () =>
        (...args): boolean => {
            const [, , { gitForgesConfig, oidc }] = args;

            return (
                (gitForgesConfig.forges.length !== 0 ||
                    !gitForgesConfig.disallowUserToAddForges) &&
                oidc.isUserLoggedIn
            );
        },
    canUserAddForges:
        () =>
        (...args): boolean => {
            const [dispatch, , { gitForgesConfig }] = args;

            return (
                dispatch(thunks.isAvailable()) && !gitForgesConfig.disallowUserToAddForges
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

            const [, , { gitForgesConfig }] = args;

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
                const { userForges } = protectedSelectors.persistedGitConfig(getState());

                const forges = [
                    ...gitForgesConfig.forges.map(config => ({
                        config,
                        isAddedByUser: false
                    })),
                    ...(gitForgesConfig.disallowUserToAddForges ? [] : userForges).map(
                        userForge => ({
                            config: getUserForgeConfig({ userForge }),
                            isAddedByUser: true
                        })
                    )
                ].map(({ config, isAddedByUser }) =>
                    dispatch(privateThunks.createGitForgeEntry({ config, isAddedByUser }))
                );

                const forgeIds = forges.map(({ config }) => config.id);

                dispatch(
                    actions.loaded({
                        description: gitForgesConfig.description,
                        forges,
                        connectionByForgeId: Object.fromEntries(
                            forgeIds.map(forgeId => [
                                forgeId,
                                id<Connection>({ status: "not connected" })
                            ])
                        )
                    })
                );

                await Promise.all(
                    forgeIds.map(forgeId =>
                        dispatch(privateThunks.restoreConnection({ forgeId }))
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
     * personal access tokens and the forges added by the user it held are lost.
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
    listRepositories:
        (params: {
            forgeId: string;
            search: string;
            page: number;
            signal?: AbortSignal;
        }) =>
        async (
            ...args
        ): Promise<{ repositories: GitRepository[]; hasNextPage: boolean }> => {
            const { forgeId, search, page, signal } = params;

            const [dispatch] = args;

            const { gitForge } = dispatch(privateThunks.getGitForge({ forgeId }));

            return dispatch(
                privateThunks.callWithAccessToken({
                    forgeId,
                    call: accessToken =>
                        gitForge.listRepositories({
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
     * Empty when the url isn't one of this forge's repositories.
     */
    listBranches:
        (params: {
            forgeId: string;
            repositoryUrl: string;
            search: string;
            signal?: AbortSignal;
        }) =>
        async (...args): Promise<string[]> => {
            const { forgeId, repositoryUrl, search, signal } = params;

            const [dispatch] = args;

            const { gitForge, config } = dispatch(privateThunks.getGitForge({ forgeId }));

            const repositoryFullPath = getRepositoryFullPath({
                forgeUrl: config.url,
                repositoryUrl
            });

            if (repositoryFullPath === undefined) {
                return [];
            }

            const { branches } = await dispatch(
                privateThunks.callWithAccessToken({
                    forgeId,
                    call: accessToken =>
                        gitForge.listBranches({
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
     * OAuth forges only. Must be dispatched synchronously from the click handler:
     * the popup is opened before anything is awaited. Rejects with
     * OAuthAuthorizationError when the popup is blocked, closed or denied.
     */
    signIn:
        (params: { forgeId: string }) =>
        async (...args): Promise<void> => {
            const { forgeId } = params;

            const [dispatch, getState] = args;

            const { gitForge } = dispatch(privateThunks.getGitForge({ forgeId }));

            const { userConnection } = gitForge;

            assert(userConnection.method === "oauth");

            // NOTE: No await before this call, see GitForge.OAuth.signIn.
            const prTokens = userConnection.signIn();

            const connection_before = dispatch(privateThunks.getConnection({ forgeId }));

            assert(selectors.stateDescription(getState()) === "ready");

            dispatch(
                actions.connectionChanged({
                    forgeId,
                    connection: { status: "connecting" }
                })
            );

            let user: GitUser;

            try {
                const tokens = await prTokens;

                globalContext.oauthAccessTokenByForgeId.set(forgeId, {
                    accessToken: tokens.accessToken,
                    expirationTime: tokens.expirationTime
                });

                user = await gitForge.getUser({ accessToken: tokens.accessToken });
            } catch (error) {
                dispatch(
                    actions.connectionChanged({
                        forgeId,
                        connection: connection_before
                    })
                );
                throw error;
            }

            dispatch(
                actions.connectionChanged({
                    forgeId,
                    connection: {
                        status: "connected",
                        user,
                        personalAccessTokenExpirationTime: undefined
                    }
                })
            );
        },
    /**
     * OAuth forges only. Revokes the grant when the forge supports it. When it
     * doesn't, or the revocation fails, the user has to revoke it on the forge
     * (authorizedApplicationsUrl): isGrantRevoked is false. Signed out locally anyway.
     */
    signOut:
        (params: { forgeId: string }) =>
        async (...args): Promise<{ isGrantRevoked: boolean }> => {
            const { forgeId } = params;

            const [dispatch] = args;

            const { gitForge } = dispatch(privateThunks.getGitForge({ forgeId }));

            const { userConnection } = gitForge;

            assert(userConnection.method === "oauth");

            // NOTE: Drops the session right away, the revocation goes on.
            const prSignOut = userConnection.signOut();

            globalContext.oauthAccessTokenByForgeId.delete(forgeId);

            dispatch(
                actions.connectionChanged({
                    forgeId,
                    connection: { status: "not connected" }
                })
            );

            return prSignOut;
        },
    /**
     * PAT forges only. The token is checked (getUser) before being saved: when the
     * forge rejects it, nothing is saved.
     */
    setPersonalAccessToken:
        (params: { forgeId: string; personalAccessToken: string }) =>
        async (...args): Promise<{ isAccepted: boolean }> => {
            const { forgeId } = params;

            const [dispatch] = args;

            const personalAccessToken = params.personalAccessToken.trim();

            const { gitForge } = dispatch(privateThunks.getGitForge({ forgeId }));

            assert(gitForge.userConnection.method === "personal-access-token");

            let connection: Connection;

            try {
                connection = await checkPersonalAccessToken({
                    gitForge,
                    personalAccessToken
                });
            } catch (error) {
                if (error instanceof GitForgeUnauthorizedError) {
                    return { isAccepted: false };
                }
                throw error;
            }

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => ({
                        ...gitConfig,
                        personalAccessTokenByForgeId: {
                            ...gitConfig.personalAccessTokenByForgeId,
                            [forgeId]: personalAccessToken
                        }
                    })
                })
            );

            dispatch(actions.connectionChanged({ forgeId, connection }));

            return { isAccepted: true };
        },
    removePersonalAccessToken:
        (params: { forgeId: string }) =>
        async (...args): Promise<void> => {
            const { forgeId } = params;

            const [dispatch] = args;

            assert(
                dispatch(privateThunks.getGitForge({ forgeId })).gitForge.userConnection
                    .method === "personal-access-token"
            );

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => ({
                        ...gitConfig,
                        personalAccessTokenByForgeId: omitKey(
                            gitConfig.personalAccessTokenByForgeId,
                            forgeId
                        )
                    })
                })
            );

            dispatch(
                actions.connectionChanged({
                    forgeId,
                    connection: { status: "not connected" }
                })
            );
        },
    /**
     * A forge of the user's own (gitlab.com, github.com...), always with a personal
     * access token. Nothing is saved unless the forge accepts the token: a wrong url
     * or type, or a forge that doesn't allow CORS (Forgejo without [cors] ENABLED),
     * is "forge unreachable".
     */
    addUserForge:
        (params: {
            type: GitForgesConfig.ForgeType;
            url: string;
            /** Empty: the host of the url */
            displayName: string;
            personalAccessToken: string;
        }) =>
        async (
            ...args
        ): Promise<
            | { isSuccess: true; forgeId: string }
            | { isSuccess: false; error: AddUserForgeError }
        > => {
            const { type, url, displayName } = params;

            const [dispatch, getState, { gitForgesConfig }] = args;

            assert(dispatch(thunks.canUserAddForges()));
            assert(selectors.stateDescription(getState()) === "ready");

            const personalAccessToken = params.personalAccessToken.trim();

            const result = createUserForge({
                type,
                url,
                displayName,
                gitForgesConfig,
                userForges: protectedSelectors.persistedGitConfig(getState()).userForges
            });

            if (!result.isSuccess) {
                return result;
            }

            const { userForge } = result;

            // NOTE: A previous attempt with the same url may have been of another type.
            globalContext.gitForgeByForgeId.delete(userForge.id);

            const forge = dispatch(
                privateThunks.createGitForgeEntry({
                    config: getUserForgeConfig({ userForge }),
                    isAddedByUser: true
                })
            );

            const gitForge = dispatch(
                privateThunks.getGitForgeAdapter({ config: forge.config })
            );

            let connection: Connection;

            try {
                connection = await checkPersonalAccessToken({
                    gitForge,
                    personalAccessToken
                });
            } catch (error) {
                return { isSuccess: false, error: getTokenCheckError(error) };
            }

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => ({
                        ...gitConfig,
                        personalAccessTokenByForgeId: {
                            ...gitConfig.personalAccessTokenByForgeId,
                            [userForge.id]: personalAccessToken
                        },
                        userForges: [
                            ...gitConfig.userForges.filter(
                                ({ id }) => id !== userForge.id
                            ),
                            userForge
                        ]
                    })
                })
            );

            dispatch(actions.forgeAdded({ forge, connection }));

            return { isSuccess: true, forgeId: userForge.id };
        },
    /**
     * A forge the user added, edited. personalAccessToken undefined: the saved one is
     * kept, it must then be the same forge (type and url). Nothing is saved unless the
     * forge accepts the new token.
     */
    updateUserForge:
        (params: {
            forgeId: string;
            type: GitForgesConfig.ForgeType;
            url: string;
            /** Empty: the host of the url */
            displayName: string;
            personalAccessToken: string | undefined;
        }) =>
        async (
            ...args
        ): Promise<
            | { isSuccess: true; forgeId: string }
            | { isSuccess: false; error: UpdateUserForgeError }
        > => {
            const { forgeId, type, url, displayName } = params;

            const [dispatch, getState, { gitForgesConfig }] = args;

            assert(selectors.stateDescription(getState()) === "ready");

            const persistedGitConfig = protectedSelectors.persistedGitConfig(getState());

            const userForge_before = persistedGitConfig.userForges.find(
                ({ id }) => id === forgeId
            );

            assert(userForge_before !== undefined, `No user forge ${forgeId}`);

            const result = createUserForge({
                type,
                url,
                displayName,
                gitForgesConfig,
                // NOTE: Its own url isn't "already configured".
                userForges: persistedGitConfig.userForges.filter(
                    ({ id }) => id !== forgeId
                )
            });

            if (!result.isSuccess) {
                return result;
            }

            const { userForge } = result;

            // NOTE: The url with its scheme, not the id: the saved token isn't sent
            // over http when it was given for https.
            const isSameForge =
                userForge.url === userForge_before.url &&
                userForge.type === userForge_before.type;

            const personalAccessToken_new = (() => {
                const value = params.personalAccessToken?.trim();

                return value === "" ? undefined : value;
            })();

            if (personalAccessToken_new === undefined && !isSameForge) {
                return { isSuccess: false, error: "personal access token required" };
            }

            const personalAccessToken =
                personalAccessToken_new ??
                persistedGitConfig.personalAccessTokenByForgeId[forgeId];

            globalContext.gitForgeByForgeId.delete(forgeId);
            globalContext.gitForgeByForgeId.delete(userForge.id);

            const forge = dispatch(
                privateThunks.createGitForgeEntry({
                    config: getUserForgeConfig({ userForge }),
                    isAddedByUser: true
                })
            );

            let connection: Connection;

            if (personalAccessToken_new === undefined) {
                // NOTE: Only the name changed, the connection is the same.
                connection = dispatch(privateThunks.getConnection({ forgeId }));
            } else {
                const gitForge = dispatch(
                    privateThunks.getGitForgeAdapter({ config: forge.config })
                );

                try {
                    connection = await checkPersonalAccessToken({
                        gitForge,
                        personalAccessToken: personalAccessToken_new
                    });
                } catch (error) {
                    // NOTE: The adapter cached for the attempted config, the id may be
                    // the same: recreated from the saved forge when needed again.
                    globalContext.gitForgeByForgeId.delete(forgeId);
                    globalContext.gitForgeByForgeId.delete(userForge.id);

                    return { isSuccess: false, error: getTokenCheckError(error) };
                }
            }

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => {
                        const rest = omitKey(
                            gitConfig.personalAccessTokenByForgeId,
                            forgeId
                        );

                        return {
                            ...gitConfig,
                            personalAccessTokenByForgeId:
                                personalAccessToken === undefined
                                    ? rest
                                    : { ...rest, [userForge.id]: personalAccessToken },
                            userForges: gitConfig.userForges.map(userForge_i =>
                                userForge_i.id === forgeId ? userForge : userForge_i
                            )
                        };
                    }
                })
            );

            dispatch(
                actions.forgeUpdated({
                    forgeId_before: forgeId,
                    forge,
                    connection
                })
            );

            return { isSuccess: true, forgeId: userForge.id };
        },
    /** A forge the user added, with its token. */
    removeUserForge:
        (params: { forgeId: string }) =>
        async (...args): Promise<void> => {
            const { forgeId } = params;

            const [dispatch, getState] = args;

            assert(
                (protectedSelectors.forges(getState()) ?? []).some(
                    ({ config, isAddedByUser }) => isAddedByUser && config.id === forgeId
                )
            );

            await dispatch(
                privateThunks.mutatePersistedGitConfig({
                    mutate: gitConfig => ({
                        personalAccessTokenByForgeId: omitKey(
                            gitConfig.personalAccessTokenByForgeId,
                            forgeId
                        ),
                        userForges: gitConfig.userForges.filter(
                            ({ id }) => id !== forgeId
                        )
                    })
                })
            );

            dispatch(actions.forgeRemoved({ forgeId }));

            globalContext.gitForgeByForgeId.delete(forgeId);
        },
    /**
     * `.git` of the XOnyxia context, called when the launcher opens. Loads the use case
     * if that hasn't happened yet.
     * - git.forges: the connected forges, see getForgesContext.
     * - git.enabled: at least one Git forge is connected.
     * - What is created at launch is a marker, replaced by getServiceGitCredentials.
     */
    getGitContext:
        () =>
        async (...args): Promise<XOnyxiaContext["git"]> => {
            const [dispatch, getState] = args;

            // NOTE: Does nothing when the integration is disabled, never ready then.
            await dispatch(thunks.load());

            if (selectors.stateDescription(getState()) !== "ready") {
                return {
                    enabled: false,
                    forges: []
                };
            }

            const forges = dispatch(privateThunks.getForgesContext());

            return {
                enabled: forges.length !== 0,
                forges
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

            const forgeIds = new Set(
                (protectedSelectors.forges(getState()) ?? []).map(
                    ({ config }) => config.id
                )
            );

            return params.markers
                .map(parseServiceCredentialsMarker)
                .filter(exclude(undefined))
                .some(
                    ({ forgeId }) =>
                        forgeIds.has(forgeId) &&
                        dispatch(privateThunks.getGitForge({ forgeId })).gitForge
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

            const [dispatch, getState] = args;

            const forgeIds = [
                ...new Set(
                    params.markers
                        .map(parseServiceCredentialsMarker)
                        .filter(exclude(undefined))
                        .map(({ forgeId }) => forgeId)
                )
            ];

            const isOAuthByForgeIndex = forgeIds.map(
                forgeId =>
                    dispatch(privateThunks.getGitForge({ forgeId })).gitForge
                        .serviceCredentials.method === "oauth"
            );

            /**
             * The tokens are only created once every authorization (popup) went through:
             * the user may deny or close one, a token created meanwhile would be lost.
             */
            const dAreAuthorizationsGranted = new Deferred<boolean>();

            // NOTE: No await before this map, the popups are opened in it.
            const prResults = forgeIds.map(
                async (
                    forgeId
                ): Promise<
                    | {
                          isSuccess: true;
                          valueByKind: Partial<
                              Record<ServiceCredentialsMarker.Kind, string>
                          >;
                      }
                    | { isSuccess: false; error: ServiceGitCredentialsError }
                > => {
                    const { config, gitForge } = dispatch(
                        privateThunks.getGitForge({ forgeId })
                    );

                    const createError = (
                        reason: ServiceGitCredentialsError["reason"],
                        detail?: string
                    ) => ({
                        isSuccess: false as const,
                        error: {
                            forgeId,
                            forgeDisplayName: config.displayName,
                            reason,
                            detail
                        }
                    });

                    const { serviceCredentials } = gitForge;

                    switch (serviceCredentials.method) {
                        case "oauth": {
                            const { authorizeAtLaunch } = serviceCredentials;

                            let tokens: GitForge.ServiceTokens;

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
                                            error.forgeError
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

                            // NOTE: The one announced in the XOnyxia context, unless it
                            // wasn't computed in this tab.
                            const expirationTime =
                                globalContext.scopedAccessTokenExpirationTimeByForgeId.get(
                                    forgeId
                                ) ??
                                getScopedAccessTokenExpirationTime({
                                    lifetimeDays:
                                        config.authentication.service.lifetimeDays
                                });

                            if (!(await dAreAuthorizationsGranted.pr)) {
                                // NOTE: The launch fails on the authorization error.
                                return { isSuccess: true, valueByKind: {} };
                            }

                            try {
                                // NOTE: Refreshed and retried once when rejected.
                                const { token } = await dispatch(
                                    privateThunks.callWithAccessToken({
                                        forgeId,
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
                                    dispatch(privateThunks.getConnection({ forgeId }))
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
                        case "user-token": {
                            const personalAccessToken =
                                protectedSelectors.persistedGitConfig(getState())
                                    .personalAccessTokenByForgeId[forgeId];

                            const connection = dispatch(
                                privateThunks.getConnection({ forgeId })
                            );

                            if (
                                personalAccessToken === undefined ||
                                (connection.status === "error" &&
                                    connection.reason ===
                                        "personal access token rejected")
                            ) {
                                return createError("sign in required");
                            }

                            return {
                                isSuccess: true,
                                valueByKind: { "access-token": personalAccessToken }
                            };
                        }
                    }
                }
            );

            Promise.all(prResults.filter((_, i) => isOAuthByForgeIndex[i])).then(
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

                const forgeId = forgeIds[i];

                for (const [kind, value] of Object.entries(result.valueByKind)) {
                    valueByMarker[
                        createServiceCredentialsMarker({
                            kind: kind as ServiceCredentialsMarker.Kind,
                            forgeId
                        })
                    ] = value;
                }
            }

            return { isSuccess: true, valueByMarker };
        }
} satisfies Thunks;

export type AddUserForgeError =
    | UserForgeCreationError
    | "personal access token rejected"
    | "forge unreachable";

/** personal access token required: the forge changed, its token can't be kept */
export type UpdateUserForgeError = AddUserForgeError | "personal access token required";

export type ServiceGitCredentialsError = {
    forgeId: string;
    forgeDisplayName: string;
    /** sign in required: the session expired or the PAT was rejected, see Account → Git */
    reason:
        | "popup blocked"
        | "authorization cancelled"
        | "authorization denied"
        | "sign in required"
        | "request failed";
    /** authorization denied: what the forge said. request failed: the error */
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
     * git.forges: the connected forges, in the order of gitForges.
     * Identity: the forge's user, the Onyxia (Keycloak) account's for what it doesn't
     * give (private email). Credentials:
     * - personal-access-token: a marker for the user's PAT, put at launch.
     * - scoped-access-token: markers, the token is created at launch.
     * - oauth: the helper config, and a marker for the refresh token Onyxia gets at
     *   launch (one popup, shared by the forges).
     */
    getForgesContext:
        () =>
        (...args): XOnyxiaContext["git"]["forges"] => {
            const [dispatch, getState] = args;

            const connections = selectors.connections(getState());

            assert(connections !== undefined);

            const identity_onyxia = dispatch(privateThunks.getOnyxiaIdentity());

            return connections
                .map(
                    ({
                        forgeId,
                        connection
                    }): XOnyxiaContext["git"]["forges"][number] | undefined => {
                        if (connection.status !== "connected") {
                            return undefined;
                        }

                        const { config, gitForge } = dispatch(
                            privateThunks.getGitForge({ forgeId })
                        );

                        const credentials =
                            ((): XOnyxiaContext["git"]["forges"][number]["credentials"] => {
                                const { serviceCredentials } = gitForge;

                                switch (serviceCredentials.method) {
                                    case "user-token": {
                                        const personalAccessToken =
                                            protectedSelectors.persistedGitConfig(
                                                getState()
                                            ).personalAccessTokenByForgeId[forgeId];

                                        if (personalAccessToken === undefined) {
                                            return undefined;
                                        }

                                        // NOTE: A marker too, not the PAT: the helm
                                        // values end up in saved and shared
                                        // configurations, and a link could otherwise
                                        // pair it with another url.
                                        return {
                                            type: "token",
                                            username: gitForge.getGitUsername({
                                                user: connection.user
                                            }),
                                            token: createServiceCredentialsMarker({
                                                kind: "access-token",
                                                forgeId
                                            }),
                                            expirationTime: undefined
                                        };
                                    }
                                    case "oauth": {
                                        return {
                                            type: "oauth",
                                            ...serviceCredentials.helperConfig,
                                            refreshToken: createServiceCredentialsMarker({
                                                kind: "refresh-token",
                                                forgeId
                                            })
                                        };
                                    }
                                    case "scoped-token": {
                                        assert(
                                            config.authentication.service.type ===
                                                "scoped-access-token"
                                        );

                                        const expirationTime =
                                            getScopedAccessTokenExpirationTime({
                                                lifetimeDays:
                                                    config.authentication.service
                                                        .lifetimeDays
                                            });

                                        globalContext.scopedAccessTokenExpirationTimeByForgeId.set(
                                            forgeId,
                                            expirationTime
                                        );

                                        return {
                                            type: "token",
                                            username: gitForge.getGitUsername({
                                                user: connection.user
                                            }),
                                            token: createServiceCredentialsMarker({
                                                kind: "access-token",
                                                forgeId
                                            }),
                                            expirationTime
                                        };
                                    }
                                }
                            })();

                        return {
                            id: forgeId,
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
    /** The forge, of the state, with its adapter. The use case must be loaded. */
    getGitForge:
        (params: { forgeId: string }) =>
        (
            ...args
        ): GitForgeEntry & {
            gitForge: GitForge;
        } => {
            const [dispatch, getState] = args;

            const entry = protectedSelectors
                .forges(getState())
                ?.find(({ config }) => config.id === params.forgeId);

            assert(entry !== undefined, `No git forge ${params.forgeId}`);

            return {
                ...entry,
                gitForge: dispatch(
                    privateThunks.getGitForgeAdapter({ config: entry.config })
                )
            };
        },
    /** The adapters are kept out of the state, created once per forge */
    getGitForgeAdapter:
        (params: { config: GitForgesConfig.Forge }) =>
        (...args): GitForge => {
            const { config } = params;

            const [, , { createGitForge }] = args;

            let gitForge = globalContext.gitForgeByForgeId.get(config.id);

            if (gitForge === undefined) {
                gitForge = createGitForge({ config });
                globalContext.gitForgeByForgeId.set(config.id, gitForge);
            }

            return gitForge;
        },
    /** What the state keeps of a forge, see GitForgeEntry */
    createGitForgeEntry:
        (params: { config: GitForgesConfig.Forge; isAddedByUser: boolean }) =>
        (...args): GitForgeEntry => {
            const { config, isAddedByUser } = params;

            const [dispatch] = args;

            const { userConnection } = dispatch(
                privateThunks.getGitForgeAdapter({ config })
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
        (params: { forgeId: string }) =>
        (...[, getState]): Connection =>
            selectors
                .connections(getState())
                ?.find(({ forgeId }) => forgeId === params.forgeId)?.connection ?? {
                status: "not connected"
            },
    /**
     * Copies the former GitHub PAT, once, when gitConfigStr doesn't exist yet.
     * Resolves false when the persisted config can't be read back.
     */
    migrateOrCheckPersistedGitConfig:
        () =>
        async (...args): Promise<boolean> => {
            const [dispatch, getState, { gitForgesConfig }] = args;

            const { gitConfigStr, githubPersonalAccessToken } =
                userConfigs.selectors.userConfigs(getState());

            if (gitConfigStr !== null) {
                return parseGitConfigStr({ gitConfigStr }) !== undefined;
            }

            const gitConfig_migrated = createMigratedPersistedGitConfig({
                gitForgesConfig,
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
        (params: { forgeId: string }) =>
        async (...args): Promise<void> => {
            const { forgeId } = params;

            const [dispatch, getState] = args;

            const { gitForge } = dispatch(privateThunks.getGitForge({ forgeId }));

            const hasCredentials = (() => {
                switch (gitForge.userConnection.method) {
                    case "oauth":
                        return gitForge.userConnection.hasSession();
                    case "personal-access-token":
                        return (
                            protectedSelectors.persistedGitConfig(getState())
                                .personalAccessTokenByForgeId[forgeId] !== undefined
                        );
                }
            })();

            if (!hasCredentials) {
                return;
            }

            dispatch(
                actions.connectionChanged({
                    forgeId,
                    connection: { status: "connecting" }
                })
            );

            let user: GitUser;

            try {
                user = await dispatch(
                    privateThunks.callWithAccessToken({
                        forgeId,
                        call: accessToken => gitForge.getUser({ accessToken })
                    })
                );
            } catch {
                // NOTE: A rejected token has already been reported as such.
                if (
                    dispatch(privateThunks.getConnection({ forgeId })).status !== "error"
                ) {
                    dispatch(
                        actions.connectionChanged({
                            forgeId,
                            connection: { status: "error", reason: "loading failed" }
                        })
                    );
                }
                return;
            }

            const personalAccessTokenExpirationTime =
                await getPersonalAccessTokenExpirationTime({
                    gitForge,
                    personalAccessToken:
                        protectedSelectors.persistedGitConfig(getState())
                            .personalAccessTokenByForgeId[forgeId]
                });

            dispatch(
                actions.connectionChanged({
                    forgeId,
                    connection: {
                        status: "connected",
                        user,
                        personalAccessTokenExpirationTime
                    }
                })
            );
        },
    /**
     * Calls the forge with the PAT or the OAuth access token. For OAuth, a 401
     * refreshes the access token and retries, once. A rejected PAT or refresh token is
     * reported in the connection of the forge.
     */
    callWithAccessToken:
        <T>(params: { forgeId: string; call: (accessToken: string) => Promise<T> }) =>
        async (...args): Promise<T> => {
            const { forgeId, call } = params;

            const [dispatch, getState] = args;

            const { gitForge } = dispatch(privateThunks.getGitForge({ forgeId }));

            switch (gitForge.userConnection.method) {
                case "personal-access-token": {
                    const personalAccessToken =
                        protectedSelectors.persistedGitConfig(getState())
                            .personalAccessTokenByForgeId[forgeId];

                    assert(
                        personalAccessToken !== undefined,
                        `No personal access token for ${forgeId}`
                    );

                    try {
                        return await call(personalAccessToken);
                    } catch (error) {
                        if (
                            error instanceof GitForgeUnauthorizedError &&
                            // NOTE: Not if the user replaced it meanwhile.
                            protectedSelectors.persistedGitConfig(getState())
                                .personalAccessTokenByForgeId[forgeId] ===
                                personalAccessToken
                        ) {
                            dispatch(
                                actions.connectionChanged({
                                    forgeId,
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
                            forgeId,
                            doForceRefresh: false
                        })
                    );

                    try {
                        return await call(accessToken);
                    } catch (error) {
                        if (!(error instanceof GitForgeUnauthorizedError)) {
                            throw error;
                        }
                    }

                    return call(
                        await dispatch(
                            privateThunks.getOAuthAccessToken({
                                forgeId,
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
        (params: { forgeId: string; doForceRefresh: boolean }) =>
        async (...args): Promise<string> => {
            const { forgeId, doForceRefresh } = params;

            const [dispatch] = args;

            if (!doForceRefresh) {
                const cached = globalContext.oauthAccessTokenByForgeId.get(forgeId);

                if (
                    cached !== undefined &&
                    cached.expirationTime - ACCESS_TOKEN_EXPIRATION_MARGIN_MS > Date.now()
                ) {
                    return cached.accessToken;
                }
            }

            {
                const prRefresh = globalContext.prRefreshByForgeId.get(forgeId);

                if (prRefresh !== undefined) {
                    return prRefresh;
                }
            }

            const { gitForge } = dispatch(privateThunks.getGitForge({ forgeId }));

            const { userConnection } = gitForge;

            assert(userConnection.method === "oauth");

            const prRefresh = userConnection.refreshTokens().then(tokens => {
                globalContext.oauthAccessTokenByForgeId.set(forgeId, tokens);

                return tokens.accessToken;
            });

            globalContext.prRefreshByForgeId.set(forgeId, prRefresh);

            try {
                return await prRefresh;
            } catch (error) {
                if (error instanceof GitForgeUnauthorizedError) {
                    // NOTE: The forge has dropped the session.
                    globalContext.oauthAccessTokenByForgeId.delete(forgeId);

                    dispatch(
                        actions.connectionChanged({
                            forgeId,
                            connection: { status: "error", reason: "session expired" }
                        })
                    );
                }
                throw error;
            } finally {
                globalContext.prRefreshByForgeId.delete(forgeId);
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
 * The connection a personal access token gives, once the forge accepted it. Throws
 * GitForgeUnauthorizedError when it is rejected, another error when the forge
 * can't be reached.
 */
async function checkPersonalAccessToken(params: {
    gitForge: GitForge;
    personalAccessToken: string;
}): Promise<Connection> {
    const { gitForge, personalAccessToken } = params;

    const user = await gitForge.getUser({ accessToken: personalAccessToken });

    return {
        status: "connected",
        user,
        personalAccessTokenExpirationTime: await getPersonalAccessTokenExpirationTime({
            gitForge,
            personalAccessToken
        })
    };
}

function getTokenCheckError(
    error: unknown
): "personal access token rejected" | "forge unreachable" {
    return error instanceof GitForgeUnauthorizedError
        ? "personal access token rejected"
        : "forge unreachable";
}

/**
 * GitLab takes a date and expires the token at 00:00 UTC that day: the time advertised
 * to the service is that midnight. The day after today + lifetimeDays, so that the token
 * lasts at least lifetimeDays, within GitLab's 365 days.
 */
function getScopedAccessTokenExpirationTime(params: { lifetimeDays: number }): number {
    const { lifetimeDays } = params;

    return (
        Math.floor(Date.now() / DAY_MS) * DAY_MS +
        Math.min(lifetimeDays + 1, SCOPED_ACCESS_TOKEN_MAX_LIFETIME_DAYS) * DAY_MS
    );
}

function omitKey<T>(record: Record<string, T>, key: string): Record<string, T> {
    const { [key]: _omitted, ...rest } = record;

    return rest;
}

/**
 * Only informative: not being able to read it (older GitLab, missing scope) isn't a
 * reason not to connect, and a 401 here says nothing about the token's other uses.
 */
async function getPersonalAccessTokenExpirationTime(params: {
    gitForge: GitForge;
    personalAccessToken: string | undefined;
}): Promise<number | undefined> {
    const { gitForge, personalAccessToken } = params;

    const { userConnection } = gitForge;

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
    oauthAccessTokenByForgeId: new Map<
        string,
        { accessToken: string; expirationTime: number }
    >(),
    prRefreshByForgeId: new Map<string, Promise<string>>(),
    mutex: new Mutex(),
    /** The adapters, out of the state, see getGitForgeAdapter */
    gitForgeByForgeId: new Map<string, GitForge>(),
    /** The one announced in the XOnyxia context, the token is created with it at launch */
    scopedAccessTokenExpirationTimeByForgeId: new Map<string, number>()
};
