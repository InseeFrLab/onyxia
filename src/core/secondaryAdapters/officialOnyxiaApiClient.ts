import type { OnyxiaApiClient } from "../ports/OnyxiaApiClient";
import axios from "axios";
import type { AxiosInstance } from "axios";
import memoize from "memoizee";
import {
    onyxiaFriendlyNameFormFieldPath,
    onyxiaIsSharedFormFieldPath,
} from "core/ports/OnyxiaApiClient";
import Mustache from "mustache";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { Deferred } from "evt/tools/Deferred";
import { symToStr } from "tsafe/symToStr";
//This should be used only in ui/coreApi/StoreProvider but we break the rule
//here because we use it only for debugging purpose.
import { getEnv } from "env";
import type { JSONSchemaObject } from "core/tools/JSONSchemaObject";
import { getRandomK8sSubdomain } from "../ports/OnyxiaApiClient";

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
            axiosInstance.get<{ ip: string }>("/public/ip").then(({ data }) => data.ip),
        ),
        "getAvailableRegions": memoize(() =>
            axiosInstance
                .get<{
                    regions: {
                        id: string;
                        services: {
                            expose: { domain: string };
                            defaultConfiguration?: {
                                ipprotection?: boolean;
                                networkPolicy?: boolean;
                            };
                            namespacePrefix: string;
                            monitoring?: {
                                URLPattern?: string;
                                //"https://grafana.lab.sspcloud.fr/d/kYYgRWBMz/users-services?orgId=1&refresh=5s&var-namespace=$NAMESPACE&var-instance=$INSTANCE"
                            };
                            initScript: string;
                        };
                        data: {
                            S3: {
                                monitoring?: {
                                    URLPattern: string;
                                };
                            };
                        };
                    }[];
                }>("/public/configuration")
                .then(({ data }) =>
                    data.regions.map(region => ({
                        "id": region.id,
                        "servicesMonitoringUrlPattern":
                            region.services.monitoring?.URLPattern,
                        "s3MonitoringUrlPattern": region.data.S3.monitoring?.URLPattern,
                        "namespacePrefix": region.services.namespacePrefix,
                        "defaultIpProtection":
                            region.services.defaultConfiguration?.ipprotection,
                        "defaultNetworkPolicy":
                            region.services.defaultConfiguration?.networkPolicy,
                        "kubernetesClusterDomain": region.services.expose.domain,
                        "initScriptUrl": region.services.initScript,
                    })),
                ),
        ),
        "getCatalogs": memoize(
            () =>
                axiosInstance
                    .get<{
                        catalogs: {
                            id: string;
                            location: string;
                            catalog: {
                                packages: {
                                    description: string;
                                    icon?: string;
                                    name: string;
                                    home?: string;
                                }[];
                            };
                        }[];
                    }>("/public/catalog")
                    .then(({ data }) => data.catalogs),
            { "promise": true },
        ),
        "getPackageConfigJSONSchemaObjectWithRenderedMustachParamsFactory": ({
            catalogId,
            packageName,
        }) =>
            axiosInstance
                .get<{
                    config: JSONSchemaObject;
                    sources?: string[];
                    dependencies?: {
                        enabled: boolean;
                        name: string;
                    }[];
                }>(`/public/catalog/${catalogId}/${packageName}`)
                .then(({ data }) => ({
                    "dependencies": data.dependencies ?? [],
                    "sources": data.sources ?? [],
                    "getPackageConfigJSONSchemaObjectWithRenderedMustachParams": ({
                        mustacheParams,
                    }) =>
                        JSON.parse(
                            Mustache.render(JSON.stringify(data.config), mustacheParams),
                        ) as typeof data.config,
                })),
        ...(() => {
            const getMyLab_App = (params: { serviceId: string }) =>
                axiosInstance.get("/my-lab/app", { params });

            const launchPackage = id<OnyxiaApiClient["launchPackage"]>(
                async ({ catalogId, packageName, options, isDryRun }) => {
                    const serviceId = `${packageName}-${getRandomK8sSubdomain()}`;

                    const { data: contract } = await axiosInstance.put<
                        Record<string, unknown>[][]
                    >(`/my-lab/app`, {
                        catalogId,
                        packageName,
                        "name": serviceId,
                        options,
                        "dryRun": isDryRun,
                    });

                    while (true) {
                        try {
                            await getMyLab_App({ serviceId });
                            break;
                        } catch {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }

                    return { contract };
                },
            );

            return { launchPackage };
        })(),
        ...(() => {
            type Data = {
                apps: {
                    id: string;
                    urls: string[];
                    env: {
                        "onyxia.share": "true" | "false";
                        "onyxia.friendlyName": string;
                        "onyxia.owner": string;
                        [key: string]: string;
                    };
                    startedAt: number;
                    tasks: {
                        containers: { ready: boolean }[];
                    }[];
                    postInstallInstructions: string | undefined;
                }[];
            };

            const getMyLab_Services = memoize(
                () =>
                    axiosInstance.get<Data>("/my-lab/services").then(({ data }) => data),
                { "promise": true, "maxAge": 1000 },
            );

            type PodsStatus = {
                podRunningCount: number;
                totalPodCount: number;
            };

            function getPodsStatus(params: {
                tasks: Data["apps"][number]["tasks"];
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
                                        env[onyxiaFriendlyNameFormFieldPath] ??
                                        packageName,
                                };
                            })(),
                            postInstallInstructions,
                            urls,
                            startedAt,
                            env,
                            "ownerUsername": env["onyxia.owner"],
                            "isShared": env[onyxiaIsSharedFormFieldPath] === "true",
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
        "getUserProjects": memoize(
            () =>
                axiosInstance
                    .get<{
                        projects: {
                            id: string;
                            name: string;
                            bucket: string;
                            namespace: string;
                            vaultTopDir: string;
                        }[];
                    }>("/user/info")
                    .then(({ data }) => data.projects),
            { "promise": true },
        ),
    };

    return onyxiaApiClient;
}
