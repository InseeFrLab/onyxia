/* eslint-disable no-template-curly-in-string */
import "minimal-polyfills/Object.fromEntries";
import {
    type OnyxiaApi,
    type DeploymentRegion,
    type Catalog,
    type Chart,
    type User,
    type HelmRelease,
    type Project
} from "core/ports/OnyxiaApi";
import axios from "axios";
import type { AxiosResponse, AxiosRequestConfig } from "axios";
import memoize from "memoizee";
import { assert } from "tsafe/assert";
import { is } from "tsafe/is";
import { compareVersions } from "compare-versions";
import { injectXOnyxiaContextInValuesSchemaJson } from "./injectXOnyxiaContextInValuesSchemaJson";
import { exclude } from "tsafe/exclude";
import type { ApiTypes } from "./ApiTypes";

export function createOnyxiaApi(params: {
    url: string;
    /** undefined if user not logged in */
    getOidcAccessToken: () => string | undefined;
    getCurrentRegionId: () => string | undefined;
    getCurrentProjectId: () => string | undefined;
}): OnyxiaApi {
    const { url, getOidcAccessToken, getCurrentRegionId, getCurrentProjectId } = params;

    const { axiosInstance } = (() => {
        const axiosInstance = axios.create({ "baseURL": url, "timeout": 120_000 });

        axiosInstance.interceptors.request.use(config => ({
            ...config,
            "headers": {
                ...config?.headers,
                "Authorization": (accessToken =>
                    accessToken === undefined ? undefined : `Bearer ${accessToken}`)(
                    getOidcAccessToken()
                ),
                "ONYXIA-REGION": getCurrentRegionId(),
                "ONYXIA-PROJECT": getCurrentProjectId()
            }
        }));

        return { axiosInstance };
    })();

    const onyxiaApi: OnyxiaApi = {
        "getIp": async () => {
            const { data } =
                await axiosInstance.get<ApiTypes["/public/ip"]>("/public/ip");

            return data.ip;
        },
        "getAvailableRegionsAndOidcParams": memoize(
            async () => {
                const { data } = await axiosInstance.get<
                    ApiTypes["/public/configuration"]
                >("/public/configuration");

                {
                    const version = data.build.version;

                    console.log(
                        [
                            `inseefrlab/onyxia-api version ${version}`,
                            `https://github.com/InseeFrLab/onyxia-api/tree/${version}`,
                            `Swagger: ${
                                url.startsWith("/")
                                    ? `${window.location.origin}${url}`
                                    : url
                            }`
                        ].join("\n")
                    );
                }

                const oidcParams =
                    data.oidcConfiguration === undefined
                        ? undefined
                        : {
                              "issuerUri": data.oidcConfiguration.issuerURI,
                              "clientId": data.oidcConfiguration.clientID,
                              "serializedExtraQueryParams":
                                  data.oidcConfiguration.extraQueryParams
                          };

                const regions = data.regions.map(
                    (apiRegion): DeploymentRegion => ({
                        "id": apiRegion.id,
                        "servicesMonitoringUrlPattern":
                            apiRegion.services.monitoring?.URLPattern,
                        "defaultIpProtection":
                            apiRegion.services.defaultConfiguration?.ipprotection,
                        "defaultNetworkPolicy":
                            apiRegion.services.defaultConfiguration?.networkPolicy,
                        "kubernetesClusterDomain": apiRegion.services.expose.domain,
                        "ingressClassName": apiRegion.services.expose.ingressClassName,
                        "ingress": apiRegion.services.expose.ingress,
                        "route": apiRegion.services.expose.route,
                        "customValues": apiRegion.services.customValues,
                        "istio": apiRegion.services.expose.istio,
                        "initScriptUrl": apiRegion.services.initScript,
                        "s3": (() => {
                            const { S3 } = apiRegion.data ?? {};

                            if (S3 === undefined) {
                                return undefined;
                            }

                            return {
                                "url": S3.URL,
                                "pathStyleAccess": S3.pathStyleAccess ?? true,
                                "region": S3.region,
                                "sts":
                                    S3.sts === undefined
                                        ? undefined
                                        : {
                                              "url": S3.sts.URL,
                                              "durationSeconds": S3.sts.durationSeconds,
                                              "role": S3.sts.role,
                                              "oidcParams":
                                                  S3.sts.oidcConfiguration === undefined
                                                      ? undefined
                                                      : {
                                                            "issuerUri":
                                                                S3.sts.oidcConfiguration
                                                                    .issuerURI,
                                                            "clientId":
                                                                S3.sts.oidcConfiguration
                                                                    .clientID
                                                        }
                                          },
                                "workingDirectory":
                                    S3.workingDirectory ??
                                    (assert(
                                        S3.sts !== undefined,
                                        "If region.data.S3.sts is not undefined workingDirectory must be specified"
                                    ),
                                    {
                                        "bucketMode": "shared",
                                        "bucketName": "",
                                        "prefix": "",
                                        "prefixGroup": ""
                                    })
                            };
                        })(),
                        "allowedURIPatternForUserDefinedInitScript":
                            apiRegion.services.allowedURIPattern,
                        "kafka": (() => {
                            const { kafka } =
                                apiRegion.services.defaultConfiguration ?? {};

                            if (kafka === undefined) {
                                return undefined;
                            }
                            const { URL, topicName } = kafka;

                            return { "url": URL, topicName };
                        })(),
                        "tolerations":
                            apiRegion.services?.defaultConfiguration?.tolerations,
                        "from": apiRegion.services?.defaultConfiguration?.from,
                        "nodeSelector":
                            apiRegion.services.defaultConfiguration?.nodeSelector,
                        "startupProbe":
                            apiRegion.services.defaultConfiguration?.startupProbe,
                        "vault":
                            apiRegion.vault === undefined
                                ? undefined
                                : {
                                      "url": apiRegion.vault.URL,
                                      "kvEngine": apiRegion.vault.kvEngine,
                                      "role": apiRegion.vault.role,
                                      "authPath": apiRegion.vault.authPath,
                                      "oidcParams":
                                          apiRegion.vault.oidcConfiguration === undefined
                                              ? undefined
                                              : {
                                                    "issuerUri":
                                                        apiRegion.vault.oidcConfiguration
                                                            .issuerURI,
                                                    "clientId":
                                                        apiRegion.vault.oidcConfiguration
                                                            .clientID
                                                }
                                  },
                        "proxyInjection": apiRegion.proxyInjection,
                        "packageRepositoryInjection":
                            apiRegion.packageRepositoryInjection,
                        "certificateAuthorityInjection":
                            apiRegion.certificateAuthorityInjection,
                        "kubernetes": (() => {
                            const { k8sPublicEndpoint } = apiRegion.services;

                            if (k8sPublicEndpoint?.URL === undefined) {
                                return undefined;
                            }

                            return {
                                "url": k8sPublicEndpoint.URL,
                                "oidcParams":
                                    k8sPublicEndpoint.oidcConfiguration === undefined
                                        ? undefined
                                        : {
                                              "issuerUri":
                                                  k8sPublicEndpoint.oidcConfiguration
                                                      .issuerURI,
                                              "clientId":
                                                  k8sPublicEndpoint.oidcConfiguration
                                                      .clientID
                                          }
                            };
                        })(),
                        "sliders": apiRegion.services.defaultConfiguration?.sliders ?? {},
                        "resources": apiRegion.services.defaultConfiguration?.resources
                    })
                );

                return { regions, oidcParams };
            },
            { "promise": true }
        ),
        "getCatalogsAndCharts": memoize(
            async () => {
                const { data } = await axiosInstance.get<ApiTypes["/public/catalogs"]>(
                    getOidcAccessToken() === undefined
                        ? "/public/catalogs"
                        : "/my-lab/catalogs"
                );

                return {
                    "catalogs": data.catalogs.map(
                        (apiCatalog): Catalog => ({
                            "id": apiCatalog.id,
                            "name": apiCatalog.name,
                            "repositoryUrl": apiCatalog.location,
                            "description": apiCatalog.description,
                            "isHidden": apiCatalog.status !== "PROD"
                        })
                    ),
                    "chartsByCatalogId": Object.fromEntries(
                        data.catalogs.map(apiCatalog => {
                            const {
                                id: catalogId,
                                catalog,
                                highlightedCharts = []
                            } = apiCatalog;

                            function getChartWeight(chartName: string) {
                                const indexHighlightedCharts =
                                    highlightedCharts.findIndex(
                                        v => v.toLowerCase() === chartName.toLowerCase()
                                    );
                                return indexHighlightedCharts !== -1
                                    ? highlightedCharts.length - indexHighlightedCharts
                                    : 0;
                            }

                            const charts = Object.entries(catalog.entries)
                                .map(
                                    ([name, versions]): Chart => ({
                                        name,
                                        "versions": versions
                                            .filter(({ type }) => type !== "library")
                                            .map(
                                                ({
                                                    description,
                                                    version,
                                                    icon,
                                                    home
                                                }) => ({
                                                    description,
                                                    version,
                                                    "iconUrl": icon,
                                                    "projectHomepageUrl": home
                                                })
                                            )
                                            // Most recent version first
                                            .sort((a, b) =>
                                                compareVersions(b.version, a.version)
                                            )
                                    })
                                )
                                .filter(({ versions }) => versions.length !== 0)
                                .sort(
                                    (chartA, chartB) =>
                                        getChartWeight(chartB.name) -
                                        getChartWeight(chartA.name)
                                );

                            return [catalogId, charts];
                        })
                    )
                };
            },
            { "promise": true }
        ),
        "onboard": async ({ group }) => {
            try {
                await axiosInstance.post("/onboarding", { group });
            } catch (error) {
                assert(is<any>(error));

                if (error.response?.status === 409) {
                    //NOTE: The onboarding has already been done.
                    console.log(
                        "The onboarding has already been done, the above 409 is normal"
                    );
                    return;
                }

                if (error.response?.status === 400) {
                    //This happens in mono namespace.
                    //DODO: Decide if we want to keep this error code.
                    return;
                }

                throw error;
            }
        },
        "getHelmChartDetails": async ({ catalogId, chartName, chartVersion }) => {
            const { chartsByCatalogId, catalogs } =
                await onyxiaApi.getCatalogsAndCharts();

            function getIsDependencyLibrary(params: {
                catalogRepositoryUrl: string;
                chartName: string;
                chartVersion: string;
            }): boolean {
                const { catalogRepositoryUrl, chartName, chartVersion } = params;

                const catalog = catalogs.find(
                    catalog => catalog.repositoryUrl === catalogRepositoryUrl
                );

                if (catalog === undefined) {
                    console.warn(
                        [
                            "Here we have a dependency that is not in any catalog, we can't tel if it's a library or not",
                            "Please submit an issue about it on the onyxia repo"
                        ].join(" ")
                    );
                    return false;
                }

                const charts = chartsByCatalogId[catalog.id];

                assert(charts !== undefined);

                const chart = charts.find(chart => chart.name === chartName);

                if (chart === undefined) {
                    // We've filtered it out, it's a library
                    return true;
                }

                const version = chart.versions.find(
                    version => version.version === chartVersion
                );

                if (version === undefined) {
                    // We've filtered it out, it's a library
                    return true;
                }

                return false;
            }

            const { data } = await axiosInstance.get<
                ApiTypes["/public/catalogs/${catalogId}/charts/${chartName}/versions/${chartVersion}"]
            >(
                `/public/catalogs/${catalogId}/charts/${chartName}/versions/${chartVersion}`
            );

            return {
                "nonLibraryDependencies":
                    data.dependencies
                        ?.filter(
                            ({ name, repository, version }) =>
                                !getIsDependencyLibrary({
                                    "catalogRepositoryUrl": repository,
                                    "chartName": name,
                                    "chartVersion": version
                                })
                        )
                        .map(({ name }) => name) ?? [],
                "sourceUrls": data.sources ?? [],
                "getChartValuesSchemaJson": ({ xOnyxiaContext }) =>
                    injectXOnyxiaContextInValuesSchemaJson({
                        xOnyxiaContext,
                        "valuesSchemaJsonBeforeInjection": data.config
                    })
            };
        },
        "helmInstall": async ({
            helmReleaseName,
            catalogId,
            chartName,
            chartVersion,
            values
        }) => {
            await axiosInstance.put("/my-lab/app", {
                catalogId,
                "packageName": chartName,
                "packageVersion": chartVersion,
                "name": helmReleaseName,
                "options": values,
                "dryRun": false
            });

            const installTime = Date.now();

            while (true) {
                try {
                    await axiosInstance.get("/my-lab/app", {
                        "params": { "serviceId": helmReleaseName }
                    });

                    break;
                } catch (error) {
                    if (Date.now() - installTime > 2 * 60 * 1000) {
                        throw error;
                    }

                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        },
        "listHelmReleases": async () => {
            const { data } =
                await axiosInstance.get<ApiTypes["/my-lab/services"]>("/my-lab/services");

            return data.apps.map(
                (apiApp): HelmRelease => ({
                    "helmReleaseName": apiApp.id,
                    //TODO: Here also get the catalogId
                    "friendlyName": apiApp.env["onyxia.friendlyName"],
                    "postInstallInstructions": apiApp.postInstallInstructions,
                    "urls": apiApp.urls,
                    "startedAt": apiApp.startedAt,
                    "env": apiApp.env,
                    "appVersion": apiApp.appVersion,
                    "revision": apiApp.revision,
                    ...(() => {
                        const [chartName] = apiApp.chart.split(/-\d+\.\d+\.\d+/);

                        const [, chartVersion] = apiApp.chart.split(`${chartName}-`);

                        return {
                            chartName,
                            chartVersion
                        };
                    })(),
                    "ownerUsername": apiApp.env["onyxia.owner"],
                    "isShared": apiApp.env["onyxia.share"] === "true",
                    "areAllTasksReady":
                        apiApp.tasks.length !== 0 &&
                        apiApp.tasks[0].containers.length !== 0 &&
                        apiApp.tasks[0].containers.every(({ ready }) => ready),
                    "status": apiApp.status,
                    "taskIds": apiApp.tasks.map(({ id }) => id),
                    "events": apiApp.events.map(({ timestamp, message }) => ({
                        "time": timestamp,
                        message
                    }))
                })
            );
        },
        "helmUninstall": async ({ helmReleaseName }) => {
            const { data } = await axiosInstance.delete<{ success: boolean }>(
                `/my-lab/app`,
                { "params": { "path": helmReleaseName } }
            );

            //TODO: Wrong assertion here once, investigate
            //Deleted one service just running, deleted all the others.
            assert(data.success, "Helm release uninstall failed");
        },
        "getUserAndProjects": memoize(
            async () => {
                const { data } =
                    await axiosInstance.get<ApiTypes["/user/info"]>("/user/info");

                const projects = data.projects.map(
                    (apiProject): Project => ({
                        "id": apiProject.id,
                        "name": apiProject.name,
                        "group": apiProject.group,
                        "namespace": apiProject.namespace,
                        "vaultTopDir": apiProject.vaultTopDir
                    })
                );

                assert(
                    projects.filter(project => project.group === undefined).length === 1,
                    "There should be only one project without group (user project)"
                );

                const user: User = {
                    "username": data.idep,
                    "email": data.email,
                    ...(() => {
                        const [firstName, familyName] = data.nomComplet.split(" ");

                        return {
                            firstName,
                            familyName
                        };
                    })()
                };

                return { user, projects };
            },
            { "promise": true }
        ),
        "getQuotas": async () => {
            let resp;

            try {
                resp =
                    await axiosInstance.get<ApiTypes["/my-lab/quota"]>("/my-lab/quota");
            } catch (error) {
                assert(is<any>(error));

                if (error.response?.status === 403) {
                    return {};
                }

                throw error;
            }

            const { data } = resp;

            if (data === undefined) {
                return {};
            }

            const { spec, usage } = data;

            return Object.fromEntries(
                Object.entries(spec)
                    .map(([key, value]) => {
                        const usageValue = usage[key];

                        return [key, { "spec": value, "usage": usageValue }];
                    })
                    .filter(exclude(undefined))
            );
        },
        "getTaskLogs": async ({ helmReleaseName, taskId }) => {
            const { data } = await axiosInstance.get<string>("/my-lab/app/logs", {
                "params": {
                    "serviceId": helmReleaseName,
                    "taskId": taskId
                }
            });

            return data;
        }
    };

    let isFirstRequestMade = false;

    const onyxiaApiWithErrorLogging = Object.fromEntries(
        Object.entries(onyxiaApi).map(([key, f]) => [
            key,
            async (...args: any[]) => {
                const isThisTheFirstRequest = !isFirstRequestMade;

                isFirstRequestMade = true;

                let out: any;

                try {
                    out = await (f.call as any)(onyxiaApi, ...args);
                } catch (error) {
                    assert(
                        is<
                            Error & {
                                response?: AxiosResponse;
                                config?: AxiosRequestConfig;
                            }
                        >(error)
                    );

                    const { response, config } = error;

                    const message = [
                        isThisTheFirstRequest
                            ? [
                                  "The first request to the Onyxia API failed.",
                                  "This usually means that the Onyxia API is not configured correctly.",
                                  `Please make sure that onyxia-api is running at:`,
                                  url,
                                  ""
                              ].join("\n")
                            : undefined,
                        config === undefined
                            ? String(error)
                            : [
                                  "Onyxia API Error:",
                                  "",
                                  `${config.method?.toUpperCase()} ${config.baseURL}${
                                      config.url
                                  }`,
                                  (() => {
                                      if (response === undefined) {
                                          return error.message === "Network Error"
                                              ? "Network Error"
                                              : "No response";
                                      }

                                      return `Response: ${response.status} ${response.statusText}`;
                                  })()
                              ].join("\n")
                    ]
                        .filter(exclude(undefined))
                        .join("\n");

                    (error as any).onUnhandledOnyxiaApiError = () => {
                        alert(message);
                    };

                    throw error;
                }

                return out;
            }
        ])
    ) as OnyxiaApi;

    const handleUnhandledError = (error: any) => {
        if (error === undefined) {
            return;
        }

        if (!(error instanceof Error)) {
            return;
        }

        const { onUnhandledOnyxiaApiError } = error as any;

        if (onUnhandledOnyxiaApiError === undefined) {
            return;
        }

        onUnhandledOnyxiaApiError();
    };

    window.onunhandledrejection = event => {
        handleUnhandledError(event.reason);
        return originalOnunhandledrejection?.call(window, event);
    };

    window.onerror = function (...args) {
        const [, , , , error] = args;

        handleUnhandledError(error);

        return originalOnerror?.call(window, ...args);
    };

    return onyxiaApiWithErrorLogging;
}

const originalOnunhandledrejection = window.onunhandledrejection;
const originalOnerror = window.onerror;
