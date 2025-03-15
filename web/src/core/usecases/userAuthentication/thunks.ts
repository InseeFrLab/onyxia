import { assert, type Equals } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import { actions, type KcActionResult } from "./state";
import { protectedSelectors } from "./selectors";
import { parseKeycloakIssuerUri } from "oidc-spa/tools/parseKeycloakIssuerUri";
import { isAmong } from "tsafe/isAmong";
import { id } from "tsafe/id";

type Kc_Action = KcActionResult["kc_action"];

export const thunks = {
    login:
        (params: { doesCurrentHrefRequiresAuth: boolean }) =>
        (...args): Promise<never> => {
            const { doesCurrentHrefRequiresAuth } = params;

            const [, , { oidc }] = args;

            assert(!oidc.isUserLoggedIn);

            return oidc.login({ doesCurrentHrefRequiresAuth });
        },
    logout:
        (params: { redirectTo: "home" | "current page" }) =>
        (...args): Promise<never> => {
            const { redirectTo } = params;

            const [, , { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            return oidc.logout({ redirectTo });
        },
    kcChangePassword:
        () =>
        async (...args): Promise<never> => {
            const [, getState, { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            const isKeycloak = protectedSelectors.isKeycloak(getState());

            assert(isKeycloak);

            return oidc.goToAuthServer({
                extraQueryParams: {
                    kc_action: id<Kc_Action>("CHANGE_PASSWORD")
                }
            });
        },
    kcUpdateProfile:
        () =>
        async (...args): Promise<never> => {
            const [, getState, { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            const isKeycloak = protectedSelectors.isKeycloak(getState());

            assert(isKeycloak);

            return oidc.goToAuthServer({
                extraQueryParams: {
                    kc_action: id<Kc_Action>("UPDATE_PROFILE")
                }
            });
        },
    kcDeleteAccount:
        () =>
        async (...args): Promise<never> => {
            const [, getState, { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            const isKeycloak = protectedSelectors.isKeycloak(getState());

            assert(isKeycloak);

            return oidc.goToAuthServer({
                extraQueryParams: {
                    kc_action: id<Kc_Action>("delete_account")
                }
            });
        },
    kcRedirectToAccountConsole:
        () =>
        (...args): Promise<never> => {
            const [, getState, { oidc, paramsOfBootstrapCore }] = args;

            assert(oidc.isUserLoggedIn);

            const isKeycloak = protectedSelectors.isKeycloak(getState());

            assert(isKeycloak);

            const keycloak = parseKeycloakIssuerUri(oidc.params.issuerUri);

            assert(keycloak !== undefined);

            window.location.href = keycloak.getAccountUrl({
                backToAppFromAccountUrl: window.location.href,
                clientId: oidc.params.clientId,
                locale: paramsOfBootstrapCore.getCurrentLang()
            });

            return new Promise<never>(() => {});
        }
} satisfies Thunks;

export const protectedThunks = {
    initialize:
        () =>
        async (...args) => {
            const [dispatch, , rootContext] = args;
            const { oidc, onyxiaApi } = rootContext;

            dispatch(
                actions.initialized(
                    !oidc.isUserLoggedIn
                        ? { isUserLoggedIn: false }
                        : {
                              isUserLoggedIn: true,
                              user: (await onyxiaApi.getUserAndProjects()).user,
                              providerSpecific: (() => {
                                  case_keycloak: {
                                      const keycloak = parseKeycloakIssuerUri(
                                          oidc.params.issuerUri
                                      );

                                      if (keycloak === undefined) {
                                          break case_keycloak;
                                      }

                                      const actionResult = (() => {
                                          if (oidc.backFromAuthServer === undefined) {
                                              return undefined;
                                          }

                                          const kc_actions = [
                                              "CHANGE_PASSWORD",
                                              "UPDATE_PROFILE",
                                              "delete_account"
                                          ] as const;

                                          assert<
                                              Equals<
                                                  (typeof kc_actions)[number],
                                                  Kc_Action
                                              >
                                          >;

                                          const kc_action =
                                              oidc.backFromAuthServer.result.kc_action;

                                          if (!isAmong(kc_actions, kc_action)) {
                                              return undefined;
                                          }

                                          const kc_action_status: string | undefined =
                                              oidc.backFromAuthServer.result
                                                  .kc_action_status;

                                          switch (kc_action) {
                                              case "CHANGE_PASSWORD":
                                                  return {
                                                      kc_action,
                                                      isSuccess:
                                                          kc_action_status === "success"
                                                  };
                                              case "UPDATE_PROFILE":
                                                  return {
                                                      kc_action,
                                                      isSuccess:
                                                          kc_action_status === "success"
                                                  };
                                              case "delete_account":
                                                  return { kc_action };
                                              default:
                                                  assert<Equals<typeof kc_action, never>>;
                                          }
                                      })();

                                      return {
                                          type: "keycloak",
                                          actionResult
                                      };
                                  }

                                  return { type: "other" };
                              })()
                          }
                )
            );
        },
    getTokens:
        () =>
        async (...args) => {
            const [, , { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            const { decodedIdToken, accessToken, refreshToken } = await oidc.getTokens();

            return { decodedIdToken, accessToken, refreshToken };
        }
} satisfies Thunks;
