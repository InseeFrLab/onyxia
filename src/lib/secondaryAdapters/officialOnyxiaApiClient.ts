
import type { OnyxiaApiClient } from "../ports/OnyxiaApiClient";
import type { OidcClient } from "../ports/OidcClient";
import axios from "axios";
import type { AxiosInstance } from "axios";
import { nonNullable } from "evt";
import type { AsyncReturnType } from "evt/tools/typeSafety";
import memoize from "memoizee";

//import type { restApiPaths } from "js/restApiPaths";

//TODO: This should disappear eventually.
const restApiPaths: typeof import("js/restApiPaths")["restApiPaths"] = {
    "catalogue": "/public/catalog",
    "services": "/public/our-lab/apps",
    "mesServices": "/my-lab/group",
    "userInfo": "/user/info",
    "nouveauService": "/my-lab/app",
    "nouveauGroupe": "/my-lab/group",
    "changerEtatService": "/my-lab/app",
    "myLab": {
        "app": "/my-lab/app"
    },
    "task": "/my-lab/task",
    "cloudShell": "/cloudshell",
    "servicesV2": "/my-lab/services",
    "myServices": '/my-lab/services',
    "getService": '/my-lab/app',
    "deleteService": '/my-lab/app',
    "getLogs": '/my-lab/app/logs',
    "configuration": '/public/configuration',
};



export function createOfficialOnyxiaApiClient(
    params: {
        baseUrl: string;

        /** undefined if user not logged in */
        getCurrentlySelectedDeployRegionId: (() => string | undefined) | null;

        /** null if user not logged in */
        oidcClient: OidcClient.LoggedIn | null;
    }
): {
    onyxiaApiClient: OnyxiaApiClient;
    //TODO: Eventually this should not be returned.
    axiosInstance: AxiosInstance;
} {

    const { axiosInstance } = createAxiosInstance(params);

    const onyxiaApiClient: OnyxiaApiClient = {
        /*
        "getUserInfo": () => axiosInstance.get<AsyncReturnType<OnyxiaApiClient["getUserInfo"]>>(
            restApiPaths.userInfo
        ).then(({ data }) => data),
        */
        "getConfigurations":
            memoize(
                () => axiosInstance.get<AsyncReturnType<OnyxiaApiClient["getConfigurations"]>>(
                    restApiPaths.configuration
                ).then(({ data }) => data),
                { "promise": true }
            )
    };

    return { onyxiaApiClient, axiosInstance };

}

function createAxiosInstance(
    params: Parameters<typeof createOfficialOnyxiaApiClient>[0]
) {

    const {
        baseUrl,
        getCurrentlySelectedDeployRegionId,
        oidcClient
    } = params;

    const axiosInstance = axios.create({ "baseURL": baseUrl });

    if (oidcClient !== null) {

        axiosInstance.interceptors.request.use(
            async config => {

                oidcClient.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired();

                const { accessToken } = await oidcClient.evtOidcTokens.waitFor(nonNullable());

                return {
                    ...(config as any),
                    "headers": {
                        ...config.headers,
                        //"Authorization": `Bearer ${keycloakClient.evtOidcTokens.state!.accessToken}`
                        "Authorization": `Bearer ${accessToken}`

                    },
                    "Content-Type": 'application/json;charset=utf-8',
                    "Accept": 'application/json;charset=utf-8',
                };

            },
            error => { throw error; }
        );

    }

    if (getCurrentlySelectedDeployRegionId !== null) {

        axiosInstance.interceptors.request.use(
            config => {

                const currentlySelectedDeployRegionId =
                    getCurrentlySelectedDeployRegionId();

                return {
                    ...config,
                    ...(
                        currentlySelectedDeployRegionId === undefined ?
                            {}
                            :
                            {
                                "headers": {
                                    ...config?.headers,
                                    "ONYXIA-REGION": currentlySelectedDeployRegionId
                                }
                            }
                    )
                };

            }
        );

    }

    return { axiosInstance };


}