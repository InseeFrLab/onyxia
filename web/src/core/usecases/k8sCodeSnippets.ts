import { id } from "tsafe/id";
import type { State as RootState, Thunks } from "core/bootstrap";
import * as projectManagement from "core/usecases/projectManagement";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { parseUrl } from "core/tools/parseUrl";
import { assert } from "tsafe/assert";
import * as userAuthentication from "./userAuthentication";
import {
    createUsecaseActions,
    createUsecaseContextApi,
    createSelector
} from "clean-architecture";
import type { Oidc } from "core/ports/Oidc";

type State = State.NotRefreshed | State.Ready;

namespace State {
    type Common = {
        isRefreshing: boolean;
    };

    export type NotRefreshed = Common & {
        stateDescription: "not refreshed";
    };

    export type Ready = Common & {
        stateDescription: "ready";
        idpIssuerUrl: string;
        clientId: string;
        refreshToken: string;
        idToken: string;
        user: string;
        expirationTime: number;
    };
}

export const name = "k8sCodeSnippets";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotRefreshed>({
            stateDescription: "not refreshed",
            isRefreshing: false
        })
    ),
    reducers: {
        refreshStarted: state => {
            state.isRefreshing = true;
        },
        refreshed: (
            _state,
            {
                payload
            }: {
                payload: {
                    idpIssuerUrl: string;
                    clientId: string;
                    refreshToken: string;
                    idToken: string;
                    user: string;
                    expirationTime: number;
                };
            }
        ) => {
            const {
                idpIssuerUrl,
                clientId,
                refreshToken,
                idToken,
                user,
                expirationTime
            } = payload;

            return id<State.Ready>({
                isRefreshing: false,
                stateDescription: "ready",
                idpIssuerUrl,
                clientId,
                refreshToken,
                idToken,
                user,
                expirationTime
            });
        }
    }
});

export const thunks = {
    /** Can, and must be called before the slice is refreshed,
     * tels if the feature is available.
     */
    getIsAvailable:
        () =>
        (...args): boolean => {
            const [, getState] = args;

            const region =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());

            return region.kubernetes !== undefined;
        },
    /** Refresh is expected to be called whenever the component that use this slice mounts */
    refresh:
        () =>
        async (...args) => {
            const [dispatch, getState, rootContext] = args;

            if (getState().s3CodeSnippets.isRefreshing) {
                return;
            }

            dispatch(actions.refreshStarted());

            const region =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());

            assert(region.kubernetes !== undefined);

            const context = getContext(rootContext);

            let { kubernetesOidcClient } = context;

            if (kubernetesOidcClient === undefined) {
                const { createOidc, mergeOidcParams } = await import(
                    "core/adapters/oidc"
                );

                const { onyxiaApi, paramsOfBootstrapCore } = rootContext;

                const { oidcParams } = await onyxiaApi.getAvailableRegionsAndOidcParams();

                assert(oidcParams !== undefined);

                kubernetesOidcClient = await createOidc({
                    ...mergeOidcParams({
                        oidcParams,
                        oidcParams_partial: region.kubernetes.oidcParams
                    }),
                    autoLogin: true,
                    transformBeforeRedirectForKeycloakTheme:
                        paramsOfBootstrapCore.transformBeforeRedirectForKeycloakTheme,
                    getCurrentLang: paramsOfBootstrapCore.getCurrentLang,
                    enableDebugLogs: paramsOfBootstrapCore.enableOidcDebugLogs
                });

                context.kubernetesOidcClient = kubernetesOidcClient;
            }

            await kubernetesOidcClient.renewTokens();

            const oidcTokens = await kubernetesOidcClient.getTokens();

            const { isUserLoggedIn, user } =
                userAuthentication.selectors.main(getState());

            assert(isUserLoggedIn);

            dispatch(
                actions.refreshed({
                    idpIssuerUrl: kubernetesOidcClient.issuerUri,
                    clientId: kubernetesOidcClient.clientId,
                    refreshToken: oidcTokens.refreshToken ?? "",
                    idToken: oidcTokens.idToken,
                    user: `${region.kubernetes.usernamePrefix ?? ""}${user.username}`,
                    expirationTime:
                        oidcTokens.refreshTokenExpirationTime ??
                        oidcTokens.accessTokenExpirationTime
                })
            );
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi<{
    kubernetesOidcClient: Oidc.LoggedIn | undefined;
}>(() => ({
    kubernetesOidcClient: undefined
}));

export const selectors = (() => {
    const readyState = (rootState: RootState): State.Ready | undefined => {
        const state = rootState[name];
        switch (state.stateDescription) {
            case "ready":
                return state;
            default:
                return undefined;
        }
    };

    const clusterUrl = createSelector(
        deploymentRegionManagement.selectors.currentDeploymentRegion,
        (region): string => {
            const { kubernetes } = region;

            assert(kubernetes !== undefined);

            return kubernetes.url;
        }
    );

    const namespace = createSelector(
        projectManagement.protectedSelectors.currentProject,
        selectedProject => selectedProject.namespace
    );

    const shellScript = createSelector(
        readyState,
        clusterUrl,
        namespace,
        (state, clusterUrl, namespace) => {
            if (state === undefined) {
                return undefined;
            }

            const { host } = parseUrl(clusterUrl);

            return [
                `kubectl config set-cluster ${host} \\`,
                `  --server=${clusterUrl} \\`,
                `  --insecure-skip-tls-verify=true`,
                ``,
                `kubectl config set-credentials ${state.user} \\`,
                `  --auth-provider=oidc  \\`,
                `  --auth-provider-arg=idp-issuer-url=${state.idpIssuerUrl}  \\`,
                `  --auth-provider-arg=client-id=${state.clientId}  \\`,
                `  --auth-provider-arg=refresh-token=${state.refreshToken} \\`,
                `  --auth-provider-arg=id-token=${state.idToken}`,
                ``,
                `kubectl config set-context ${host} \\`,
                `  --user=${state.user} \\`,
                `  --cluster=${host} \\`,
                `  --namespace=${namespace}`,
                ``,
                `kubectl config use-context ${host}`
            ].join("\n");
        }
    );

    const main = createSelector(
        readyState,
        clusterUrl,
        namespace,
        shellScript,
        (state, clusterUrl, namespace, shellScript) => {
            if (state === undefined) {
                return {
                    isReady: false as const,
                    clusterUrl,
                    namespace
                };
            }

            assert(shellScript !== undefined);

            const idpIssuerUrl = state.idpIssuerUrl;
            const clientId = state.clientId;
            const refreshToken = state.refreshToken;
            const idToken = state.idToken;
            const expirationTime = state.expirationTime;
            const isRefreshing = state.isRefreshing;

            return {
                isReady: true as const,
                clusterUrl,
                namespace,
                idpIssuerUrl,
                clientId,
                refreshToken,
                idToken,
                expirationTime,
                isRefreshing,
                shellScript
            };
        }
    );

    return {
        main
    };
})();
