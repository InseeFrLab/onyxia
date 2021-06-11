
import type { OnyxiaApiClient } from "../ports/OnyxiaApiClient";
import type { OidcClient } from "../ports/OidcClient";
import axios from "axios";
import type { AxiosInstance } from "axios";
import { nonNullable } from "evt";
import memoize from "memoizee";
import type {
    Public_Configuration,
    Public_Catalog,
    Public_Catalog_CatalogId_PackageName,
    MyLab_Services
} from "lib/ports/OnyxiaApiClient";
import { onyxiaFriendlyNameFormFieldPath } from "lib/ports/OnyxiaApiClient";
import Mustache from "mustache";
import { assert } from "tsafe/assert";

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
        "getConfigurations":
            memoize(
                () => axiosInstance.get<Public_Configuration>(
                    "/public/configuration"
                ).then(({ data }) => data),
                { "promise": true }
            ),
        "getCatalogs":
            memoize(
                () => axiosInstance.get<Public_Catalog>(
                    "/public/catalog"
                ).then(({ data }) => data.catalogs),
                { "promise": true }
            ),
        "getPackageConfigJSONSchemaObjectWithRenderedMustachParamsFactory":
            ({ catalogId, packageName }) => axiosInstance.get<Public_Catalog_CatalogId_PackageName>(
                `/public/catalog/${catalogId}/${packageName}`
            ).then(({ data }) => ({
                "dependencies": data.dependencies ?? [],
                "sources": data.sources,
                "getPackageConfigJSONSchemaObjectWithRenderedMustachParams": ({ mustacheParams }) => JSON.parse(
                    Mustache.render(
                        JSON.stringify(data.config),
                        mustacheParams
                    )
                ) as typeof data.config
            })),
        "launchPackage": ({ catalogId, packageName, options, isDryRun }) => axiosInstance.put<Record<string, unknown>>(
            `/my-lab/app`,
            { catalogId, packageName, options, "dryRun": isDryRun }
        ).then(({ data }) => ({ "contract": data })),
        ...(() => {

            const getMyLab_Services = memoize(
                () => axiosInstance.get<MyLab_Services>(
                    "/my-lab/services"
                ).then(({ data }) => data),
                { "promise": true, "maxAge": 1000 }
            );

            const getRunningServices = async () =>
                (await getMyLab_Services()).apps.map(
                    ({ id, env, urls, startedAt, tasks }) => ({
                        id,
                        "packageName": id.split("-")[0],
                        "friendlyName": env[onyxiaFriendlyNameFormFieldPath.join(".")],
                        urls,
                        startedAt,
                        ...(tasks[0].status.status === "Running" ?
                            { "isStarting": false } as const :
                            {
                                "isStarting": true,
                                "prStarted": new Promise<void>(
                                    function callee(resolve) {
                                        setTimeout(
                                            async () => {

                                                const app = (await getMyLab_Services())
                                                    .apps.find(app => app.id === id);

                                                if (app === undefined) {
                                                    //Package no longer running, we leave it pending.
                                                    return;
                                                }

                                                if (app.tasks[0].status.status !== "Running") {

                                                    callee(resolve);

                                                    return;

                                                }

                                                try{ 

                                                    await axios.create().get(urls[0]);

                                                }catch(error){

                                                    console.log("A 503 error are expected to be log in the console");

                                                    callee(resolve);

                                                    return;

                                                }

                                                resolve();

                                            },
                                            1000
                                        )
                                    }
                                )
                            } as const
                        )
                    })
                );


            return { getRunningServices };


        })(),
        "stopService": ({ serviceId })=> axiosInstance.delete<{ success: boolean}>(
            `/my-lab/app`,
            { "params": { "path": serviceId } }
        ).then(({ data }) => { assert(data.success); })
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