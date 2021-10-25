import type { OnyxiaApiClient } from "../ports/OnyxiaApiClient";
import axios from "axios";
import type { AxiosInstance } from "axios";
import memoize from "memoizee";
import type {
    Get_Public_Configuration,
    Get_Public_Catalog,
    Get_Public_Catalog_CatalogId_PackageName,
    Get_MyLab_Services,
    Put_MyLab_App,
    Get_MyLab_App,
    Get_Public_Ip,
    Get_User_Info,
} from "lib/ports/OnyxiaApiClient";
import { onyxiaFriendlyNameFormFieldPath } from "lib/ports/OnyxiaApiClient";
import Mustache from "mustache";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { Deferred } from "evt/tools/Deferred";
import { symToStr } from "tsafe/symToStr";
//This should be used only in app/libApi/StoreProvider but we break the rule
//here because we use it only for debugging purpose.
import { getEnv } from "env";

/** @deprecated */
const dAxiosInstance = new Deferred<AxiosInstance>();

export const { pr: prAxiosInstance } = dAxiosInstance;

export function createOfficialOnyxiaApiClient(params: {
    url: string;
    /** returns undefined before region initially fetched */
    getCurrentlySelectedDeployRegionId: () => string | undefined;
    /** undefined if user not logged in */
    getOidcAccessToken: (() => Promise<string>) | undefined;
    /** undefined if user not logged in, return undefined before projects initially fetched */
    getCurrentlySelectedProjectId: (() => string | undefined) | undefined;
}): OnyxiaApiClient {
    const {
        url,
        getCurrentlySelectedDeployRegionId,
        getOidcAccessToken,
        getCurrentlySelectedProjectId,
    } = params;

    const { axiosInstance } = (() => {
        const axiosInstance = axios.create({ "baseURL": url });

        if (getOidcAccessToken !== undefined) {
            axiosInstance.interceptors.request.use(
                async config => ({
                    ...(config as any),
                    "headers": {
                        ...config.headers,
                        "Authorization": `Bearer ${await getOidcAccessToken()}`,
                    },
                    "Content-Type": "application/json;charset=utf-8",
                    "Accept": "application/json;charset=utf-8",
                }),
                error => {
                    throw error;
                },
            );
        }

        {
            const errorMessage = [
                `There isn't an onyxia-api hosted at ${url}`,
                `Check the ${(() => {
                    const { ONYXIA_API_URL } = getEnv();
                    return symToStr({ ONYXIA_API_URL });
                })()} environnement variable you provided with docker run.`,
            ].join(" ");

            axiosInstance.interceptors.response.use(
                res => {
                    if (res.headers["content-type"] !== "application/json") {
                        alert(errorMessage);
                        throw new Error(errorMessage);
                    }

                    return res;
                },
                error => {
                    alert(errorMessage);

                    throw error;
                },
            );
        }

        axiosInstance.interceptors.request.use(config => {
            const currentlySelectedDeployRegionId = getCurrentlySelectedDeployRegionId();
            const currentlySelectedProjectId = getCurrentlySelectedProjectId?.();

            return {
                ...config,
                "headers": {
                    ...config?.headers,
                    ...(currentlySelectedDeployRegionId === undefined
                        ? {}
                        : {
                              "ONYXIA-REGION": currentlySelectedDeployRegionId,
                          }),
                    ...(currentlySelectedDeployRegionId === undefined
                        ? {}
                        : {
                              "ONYXIA-PROJECT": currentlySelectedProjectId,
                          }),
                },
            };
        });

        return { axiosInstance };
    })();

    if (axiosInstance !== undefined) {
        dAxiosInstance.resolve(axiosInstance);
    }

    const onyxiaApiClient: OnyxiaApiClient = {
        "getIp": memoize(() =>
            axiosInstance.get<Get_Public_Ip>("/public/ip").then(({ data }) => data.ip),
        ),
        "getAvailableRegions": memoize(() =>
            axiosInstance
                .get<Get_Public_Configuration>("/public/configuration")
                .then(({ data }) =>
                    data.regions.map(region => ({
                        "id": region.id,
                        "s3MonitoringUrlPattern": region.data.S3.monitoring?.URLPattern,
                        "namespacePrefix": region.services.namespacePrefix,
                        "defaultIpProtection": region.services.ipprotection,
                        "defaultNetworkPolicy": region.services.networkPolicy
                    })),
                ),
        ),
        "getCatalogs": memoize(
            () =>
                axiosInstance
                    .get<Get_Public_Catalog>("/public/catalog")
                    .then(({ data }) => data.catalogs),
            { "promise": true },
        ),
        "getPackageConfigJSONSchemaObjectWithRenderedMustachParamsFactory": ({
            catalogId,
            packageName,
        }) =>
            axiosInstance
                .get<Get_Public_Catalog_CatalogId_PackageName>(
                    `/public/catalog/${catalogId}/${packageName}`,
                )
                .then(({ data }) => ({
                    "dependencies": data.dependencies ?? [],
                    "sources": data.sources,
                    "getPackageConfigJSONSchemaObjectWithRenderedMustachParams": ({
                        mustacheParams,
                    }) =>
                        JSON.parse(
                            Mustache.render(JSON.stringify(data.config), mustacheParams),
                        ) as typeof data.config,
                })),
        ...(() => {
            const getMyLab_App = (params: { serviceId: string }) =>
                axiosInstance
                    .get<Get_MyLab_App>("/my-lab/app", { params })
                    .then(({ data }) => data);

            const launchPackage = id<OnyxiaApiClient["launchPackage"]>(
                ({ catalogId, packageName, options, isDryRun }) => {
                    const serviceId = `${packageName}-${Math.floor(
                        Math.random() * 1000000,
                    )}`;

                    return axiosInstance
                        .put<Put_MyLab_App>(`/my-lab/app`, {
                            catalogId,
                            packageName,
                            "name": serviceId,
                            options,
                            "dryRun": isDryRun,
                        })
                        .then(async ({ data: contract }) => {
                            while (true) {
                                try {
                                    await getMyLab_App({ serviceId });
                                    break;
                                } catch {
                                    await new Promise(resolve =>
                                        setTimeout(resolve, 1000),
                                    );
                                }
                            }

                            return { contract };
                        });
                },
            );

            return { launchPackage };
        })(),
        ...(() => {
            const getMyLab_Services = memoize(
                () =>
                    axiosInstance
                        .get<Get_MyLab_Services>("/my-lab/services")
                        .then(({ data }) => data),
                { "promise": true, "maxAge": 1000 },
            );

            type PodsStatus = {
                podRunningCount: number;
                totalPodCount: number;
            };

            function getPodsStatus(params: {
                tasks: Get_MyLab_Services["apps"][number]["tasks"];
                /** For debug */
                id?: string;
            }): PodsStatus | undefined {
                const { tasks, id } = params;

                try {
                    const { containers } = tasks[0];

                    return {
                        "podRunningCount": containers.filter(({ ready }) => ready).length,
                        "totalPodCount": containers.length,
                    };
                } catch {
                    if (id !== undefined) {
                        console.warn(
                            `Couldn't get the service status from tasks for ${id}`,
                        );
                    }

                    return undefined;
                }
            }

            function getAreAllPodsRunning(podStatus: PodsStatus) {
                return (
                    podStatus !== undefined &&
                    podStatus.totalPodCount !== 0 &&
                    podStatus.podRunningCount === podStatus.totalPodCount
                );
            }

            const getRunningServices = async () =>
                (await getMyLab_Services()).apps
                    .map(({ tasks, id, ...rest }) => ({
                        ...rest,
                        id,
                        "areAllPodsRunning": (() => {
                            const podsStatus = getPodsStatus({ tasks, id });

                            return podsStatus === undefined
                                ? false
                                : getAreAllPodsRunning(podsStatus);
                        })(),
                    }))
                    .map(
                        ({
                            id,
                            env,
                            urls,
                            startedAt,
                            postInstallInstructions,
                            areAllPodsRunning,
                        }) => ({
                            id,
                            ...(() => {
                                const packageName = id.split("-")[0];

                                return {
                                    packageName,
                                    "friendlyName":
                                        env[onyxiaFriendlyNameFormFieldPath.join(".")] ??
                                        packageName,
                                };
                            })(),
                            postInstallInstructions,
                            urls,
                            startedAt,
                            ...(areAllPodsRunning
                                ? ({ "isStarting": false } as const)
                                : ({
                                      "isStarting": true,
                                      "prStarted": new Promise<{
                                          isConfirmedJustStarted: boolean;
                                      }>(function callee(resolve) {
                                          setTimeout(async () => {
                                              const app = (
                                                  await getMyLab_Services()
                                              ).apps.find(app => app.id === id);

                                              if (app === undefined) {
                                                  //Package no longer running, we leave it pending.
                                                  return;
                                              }

                                              const podsStatus = getPodsStatus({
                                                  "tasks": app.tasks,
                                              });

                                              if (podsStatus === undefined) {
                                                  resolve({
                                                      "isConfirmedJustStarted": false,
                                                  });

                                                  return;
                                              }

                                              if (!getAreAllPodsRunning(podsStatus)) {
                                                  callee(resolve);
                                                  return;
                                              }

                                              resolve({ "isConfirmedJustStarted": true });
                                          }, 3000);
                                      }),
                                  } as const)),
                        }),
                    );

            return { getRunningServices };
        })(),
        "stopService": ({ serviceId }) =>
            axiosInstance
                .delete<{ success: boolean }>(`/my-lab/app`, {
                    "params": { "path": serviceId },
                })
                .then(({ data }) => {
                    //TODO: Wrong assertion here once, investigate
                    //Deleted one service just running, deleted all the others.
                    assert(data.success);
                }),
        "getUserProjects": () =>
            axiosInstance
                .get<Get_User_Info>("/user/info")
                .then(({ data }) => data.projects),
    };

    return onyxiaApiClient;
}
