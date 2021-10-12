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
} from "lib/ports/OnyxiaApiClient";
import { onyxiaFriendlyNameFormFieldPath, appStatuses } from "lib/ports/OnyxiaApiClient";
import Mustache from "mustache";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { getUrlHttpStatusCode } from "lib/tools/getPageStatus";
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
}): OnyxiaApiClient {
    const { url, getCurrentlySelectedDeployRegionId, getOidcAccessToken } = params;

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

            return {
                ...config,
                ...(currentlySelectedDeployRegionId === undefined
                    ? {}
                    : {
                          "headers": {
                              ...config?.headers,
                              "ONYXIA-REGION": currentlySelectedDeployRegionId,
                          },
                      }),
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

            function getAppStatus(params: {
                tasks: Get_MyLab_Services["apps"][number]["tasks"];
                /** For debug */
                id?: string;
            }): Get_MyLab_Services.AppStatus | undefined {
                const { tasks, id } = params;

                try {
                    const status = tasks[0]?.status.status;

                    assert(appStatuses.includes(status));

                    return status;
                } catch {
                    if (id !== undefined) {
                        console.warn(
                            `Couldn't get the service status from tasks for ${id}`,
                        );
                    }

                    return undefined;
                }
            }

            const getRunningServices = async () =>
                (await getMyLab_Services()).apps
                    .map(({ tasks, id, ...rest }) => ({
                        ...rest,
                        id,
                        "status": getAppStatus({ tasks, id }),
                    }))
                    .map(
                        ({
                            id,
                            env,
                            urls,
                            startedAt,
                            postInstallInstructions,
                            status,
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
                            ...(status === "Running"
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

                                              const newStatus = getAppStatus({
                                                  "tasks": app.tasks,
                                              });

                                              if (newStatus === "Pending") {
                                                  callee(resolve);
                                                  return;
                                              }

                                              const url = app.urls[0];

                                              if (url === undefined) {
                                                  resolve({
                                                      "isConfirmedJustStarted": false,
                                                  });
                                                  return;
                                              }

                                              //NOTE: When he get 403 (unauthorized) it mean that the service is running.
                                              //By defaults services are IP protected.
                                              //We don't ping directly from front because of CORS
                                              const httpStatusCode =
                                                  await getUrlHttpStatusCode({
                                                      url,
                                                  }).catch(error => {
                                                      console.warn(
                                                          [
                                                              `Seems like the https://helloacm.com/tools/can-visit/`,
                                                              `no longer works for checking 503: ${error.message}`,
                                                          ].join(" "),
                                                      );

                                                      return undefined;
                                                  });

                                              if (httpStatusCode === 503) {
                                                  callee(resolve);
                                                  return;
                                              }

                                              resolve({
                                                  "isConfirmedJustStarted":
                                                      status === "Pending" &&
                                                      newStatus === "Running" &&
                                                      (httpStatusCode === 403 ||
                                                          httpStatusCode === 200),
                                              });
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
    };

    return onyxiaApiClient;
}
