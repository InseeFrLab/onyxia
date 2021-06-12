
import type { OnyxiaApiClient } from "../ports/OnyxiaApiClient";
import type { OidcClient } from "../ports/OidcClient";
import axios from "axios";
import type { AxiosInstance } from "axios";
import { nonNullable } from "evt";
import memoize from "memoizee";
import type {
    Get_Public_Configuration,
    Get_Public_Catalog,
    Get_Public_Catalog_CatalogId_PackageName,
    Get_MyLab_Services,
    Put_MyLab_App,
    Get_MyLab_App
} from "lib/ports/OnyxiaApiClient";
import { onyxiaFriendlyNameFormFieldPath } from "lib/ports/OnyxiaApiClient";
import Mustache from "mustache";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";

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
                () => axiosInstance.get<Get_Public_Configuration>(
                    "/public/configuration"
                ).then(({ data }) => data),
                { "promise": true }
            ),
        "getCatalogs":
            memoize(
                () => axiosInstance.get<Get_Public_Catalog>(
                    "/public/catalog"
                ).then(({ data }) => data.catalogs),
                { "promise": true }
            ),
        "getPackageConfigJSONSchemaObjectWithRenderedMustachParamsFactory":
            ({ catalogId, packageName }) => axiosInstance.get<Get_Public_Catalog_CatalogId_PackageName>(
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
        ...((() => {

            const getMyLab_App = (params: { serviceId: string; }) => axiosInstance.get<Get_MyLab_App>(
                "/my-lab/app",
                { params }
            ).then(({ data }) => data);

            const launchPackage = id<OnyxiaApiClient["launchPackage"]>(

                ({ catalogId, packageName, options, isDryRun }) => axiosInstance.put<Put_MyLab_App>(
                    `/my-lab/app`,
                    { catalogId, packageName, options, "dryRun": isDryRun }
                ).then(async ({ data: contract }) => {

                    //We make sure the service is added before resolving.

                    const serviceId = (() => {

                        try {

                            const out = (contract[0].find(({ kind }) => kind === "Service") as any)
                                .metadata
                                .name;

                            assert(typeof out === "string");

                            return out;

                        } catch {
                            console.warn("We couldn't get the serviceId of the launched service");
                            return undefined;
                        }

                    })();

                    if (serviceId !== undefined) {

                        while (true) {

                            try {

                                await getMyLab_App({ serviceId });
                                break;

                            } catch {
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }

                        }

                    }

                    return { contract };

                })
            );

            return { launchPackage };



        })()),
        ...(() => {

            const getMyLab_Services = memoize(
                () => axiosInstance.get<Get_MyLab_Services>(
                    "/my-lab/services"
                ).then(({ data }) => data),
                { "promise": true, "maxAge": 1000 }
            );

            const getRunningServices = async () =>
                (await getMyLab_Services()).apps.map(
                    ({ id, env, urls, startedAt, tasks }) => ({
                        id,
                        ...(() => {

                            const packageName = id.split("-")[0];

                            return {
                                packageName,
                                "friendlyName": env[onyxiaFriendlyNameFormFieldPath.join(".")] ?? packageName
                            };

                        })(),
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

                                                {

                                                    const status = (() => {

                                                        try {

                                                            return app.tasks[0]?.status.status

                                                        } catch {

                                                            console.warn(`Couldn't get the service status from tasks for ${id}`);

                                                            return "Running";

                                                        }

                                                    })();

                                                    if (status !== "Running") {

                                                        callee(resolve);

                                                        return;

                                                    }

                                                }

                                                console.log("503 or CORS error are expected here");

                                                try {

                                                    await axios.create().head(urls[0]);

                                                } catch (error) {

                                                    const status = (() => {

                                                        try {
                                                            return error.response.status;
                                                        } catch {
                                                            //CORS: Firefox, Safari
                                                            return undefined;
                                                        }

                                                    })();

                                                    if (status === 503) {
                                                        callee(resolve);
                                                        return;
                                                    } else if (status === undefined) {
                                                        await new Promise(resolve => setTimeout(resolve, 25000));
                                                    }

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
        "stopService": ({ serviceId }) => axiosInstance.delete<{ success: boolean }>(
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