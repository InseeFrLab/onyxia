import { GitProviderUnauthorizedError, type GitProvider } from "core/ports/GitProvider";
import type { RawGitProvider } from "./RawGitProvider";
import type { OAuthAuthorization } from "./oauthAuthorization";
import type { GitSessionStore } from "./gitSessionStore";

/** Adds the authorization popup and the session store to the provider's OAuth endpoints */
export function createGitProviderFromRaw(params: {
    rawGitProvider: RawGitProvider;
    providerId: string;
    oauthAuthorization: OAuthAuthorization;
    gitSessionStore: GitSessionStore;
}): GitProvider {
    const { rawGitProvider, providerId, oauthAuthorization, gitSessionStore } = params;

    const { userConnection, serviceCredentials, ...rest } = rawGitProvider;

    const { redirectUri } = oauthAuthorization;

    return {
        ...rest,
        userConnection:
            userConnection.method !== "oauth"
                ? userConnection
                : {
                      method: "oauth",
                      signIn: async () => {
                          // NOTE: No await before this call, see authorizeInPopup.
                          const { code, codeVerifier } =
                              await oauthAuthorization.authorizeInPopup({
                                  getAuthorizationUrl: ({ state, codeChallenge }) =>
                                      userConnection.getAuthorizationUrl({
                                          redirectUri,
                                          state,
                                          codeChallenge
                                      })
                              });

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

                          return {
                              accessToken: tokens.accessToken,
                              expirationTime: tokens.expirationTime
                          };
                      },
                      hasSession: () => gitSessionStore.get({ providerId }) !== undefined,
                      refreshTokens: async () => {
                          try {
                              return await gitSessionStore.runExclusive({
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
                                          redirectUri
                                      });

                                      if (tokens.refreshToken !== undefined) {
                                          gitSessionStore.set({
                                              providerId,
                                              refreshToken: tokens.refreshToken
                                          });
                                      }

                                      return {
                                          accessToken: tokens.accessToken,
                                          expirationTime: tokens.expirationTime
                                      };
                                  }
                              });
                          } catch (error) {
                              if (error instanceof GitProviderUnauthorizedError) {
                                  gitSessionStore.remove({ providerId });
                              }
                              throw error;
                          }
                      },
                      signOut: async () => {
                          const session = gitSessionStore.get({ providerId });

                          gitSessionStore.remove({ providerId });

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
                      authorizedApplicationsUrl: userConnection.authorizedApplicationsUrl
                  },
        serviceCredentials:
            serviceCredentials.method !== "oauth"
                ? serviceCredentials
                : {
                      method: "oauth",
                      helperConfig: serviceCredentials.helperConfig,
                      authorizeAtLaunch: (() => {
                          const { authorizeAtLaunch } = serviceCredentials;

                          if (authorizeAtLaunch === undefined) {
                              return undefined;
                          }

                          return {
                              authorize: async () => {
                                  // NOTE: No await before this call, see authorizeInPopup.
                                  const { code, codeVerifier } =
                                      await oauthAuthorization.authorizeInPopup({
                                          getAuthorizationUrl: ({
                                              state,
                                              codeChallenge
                                          }) =>
                                              authorizeAtLaunch.getAuthorizationUrl({
                                                  redirectUri,
                                                  state,
                                                  codeChallenge
                                              })
                                      });

                                  return authorizeAtLaunch.exchangeAuthorizationCode({
                                      code,
                                      codeVerifier,
                                      redirectUri
                                  });
                              }
                          };
                      })()
                  }
    };
}
