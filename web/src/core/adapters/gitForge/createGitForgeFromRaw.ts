import { GitForgeUnauthorizedError, type GitForge } from "core/ports/GitForge";
import type { RawGitForge } from "./RawGitForge";
import type { OAuthAuthorization } from "./oauthAuthorization";
import type { GitSessionStore } from "./gitSessionStore";

/** Adds the authorization popup and the session store to the forge's OAuth endpoints */
export function createGitForgeFromRaw(params: {
    rawGitForge: RawGitForge;
    forgeId: string;
    oauthAuthorization: OAuthAuthorization;
    gitSessionStore: GitSessionStore;
}): GitForge {
    const { rawGitForge, forgeId, oauthAuthorization, gitSessionStore } = params;

    const { userConnection, serviceCredentials, ...rest } = rawGitForge;

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
                              gitSessionStore.remove({ forgeId });
                          } else {
                              gitSessionStore.set({
                                  forgeId,
                                  refreshToken: tokens.refreshToken
                              });
                          }

                          return {
                              accessToken: tokens.accessToken,
                              expirationTime: tokens.expirationTime
                          };
                      },
                      hasSession: () => gitSessionStore.get({ forgeId }) !== undefined,
                      refreshTokens: async () => {
                          try {
                              return await gitSessionStore.runExclusive({
                                  forgeId,
                                  callback: async () => {
                                      // NOTE: Read under the lock, another tab may have rotated it.
                                      const session = gitSessionStore.get({ forgeId });

                                      if (session === undefined) {
                                          throw new GitForgeUnauthorizedError(
                                              "No Git session, signed out from another tab"
                                          );
                                      }

                                      const tokens = await userConnection.refreshTokens({
                                          refreshToken: session.refreshToken,
                                          redirectUri
                                      });

                                      if (tokens.refreshToken !== undefined) {
                                          gitSessionStore.set({
                                              forgeId,
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
                              if (error instanceof GitForgeUnauthorizedError) {
                                  gitSessionStore.remove({ forgeId });
                              }
                              throw error;
                          }
                      },
                      signOut: async () => {
                          // NOTE: Under the lock, an in-flight refresh would write its
                          // rotated refresh token back after the removal.
                          const session = await gitSessionStore.runExclusive({
                              forgeId,
                              callback: async () => {
                                  const session = gitSessionStore.get({ forgeId });

                                  gitSessionStore.remove({ forgeId });

                                  return session;
                              }
                          });

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
