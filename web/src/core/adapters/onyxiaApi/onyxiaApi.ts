import "minimal-polyfills/Object.fromEntries";
import {
    type OnyxiaApi,
    type DeploymentRegion,
    type Catalog,
    type Chart,
    type User,
    type HelmRelease,
    type Project,
    type OidcParams,
    type OidcParams_Partial,
    type JSONSchema,
    zJSONSchema
} from "core/ports/OnyxiaApi";
import axios, { AxiosHeaders } from "axios";
import type { AxiosResponse, AxiosRequestConfig } from "axios";
import memoize from "memoizee";
import { assert, is } from "tsafe/assert";
import { compareVersions } from "compare-versions";
import { exclude } from "tsafe/exclude";
import type { ApiTypes } from "./ApiTypes";
import { Evt } from "evt";
import { id } from "tsafe/id";

export function createOnyxiaApi(params: {
    url: string;
    /** undefined if user not logged in */
    getOidcAccessToken: () => Promise<string | undefined>;
    getCurrentRegionId: () => string | undefined;
    getCurrentProjectId: () => string | undefined;
}): OnyxiaApi {
    const { url, getOidcAccessToken, getCurrentRegionId, getCurrentProjectId } = params;

    const getHeaders = async () => {
        const headers: Record<string, string> = {};

        add_bearer_token: {
            const accessToken = await getOidcAccessToken();

            if (accessToken === undefined) {
                break add_bearer_token;
            }

            headers["Authorization"] = `Bearer ${accessToken}`;
        }

        add_region: {
            const regionId = getCurrentRegionId();

            if (regionId === undefined) {
                break add_region;
            }

            headers["ONYXIA-REGION"] = regionId;
        }

        add_project: {
            const projectId = getCurrentProjectId();

            if (projectId === undefined) {
                break add_project;
            }

            headers["ONYXIA-PROJECT"] = projectId;
        }

        return headers;
    };

    const { axiosInstance } = (() => {
        const axiosInstance = axios.create({ baseURL: url, timeout: 120_000 });

        axiosInstance.interceptors.request.use(async config => {
            const headers = AxiosHeaders.from(config.headers);
            headers.set(await getHeaders());

            return {
                ...config,
                headers
            };
        });

        return { axiosInstance };
    })();

    const getApiCatalogsMemo = memoize(
        async () => {
            const { data } = await axiosInstance.get<
                ApiTypes["/<public|my-lab>/catalogs"]
            >(
                `/${(await getOidcAccessToken()) === undefined ? "public" : "my-lab"}/catalogs`
            );

            return data;
        },
        { promise: true }
    );

    const onyxiaApi: OnyxiaApi = {
        getIp: async () => {
            const { data } =
                await axiosInstance.get<ApiTypes["/public/ip"]>("/public/ip");

            return data.ip;
        },
        getAvailableRegionsAndOidcParams: memoize(
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
                        : id<OidcParams>({
                              issuerUri: data.oidcConfiguration.issuerURI,
                              clientId: data.oidcConfiguration.clientID,
                              extraQueryParams_raw:
                                  data.oidcConfiguration.extraQueryParams || undefined,
                              scope_spaceSeparated:
                                  data.oidcConfiguration.scope || undefined,
                              audience: data.oidcConfiguration.audience || undefined,
                              idleSessionLifetimeInSeconds: (() => {
                                  const value =
                                      data.oidcConfiguration.idleSessionLifetimeInSeconds;

                                  if (value === "" || value === undefined) {
                                      return undefined;
                                  }

                                  if (typeof value === "number") {
                                      return value;
                                  }

                                  return parseInt(value);
                              })()
                          });

                const regions = data.regions.map(
                    (apiRegion): DeploymentRegion =>
                        id<DeploymentRegion>({
                            id: apiRegion.id,
                            servicesMonitoringUrlPattern:
                                apiRegion.services.monitoring?.URLPattern,
                            defaultIpProtection:
                                apiRegion.services.defaultConfiguration?.ipprotection,
                            defaultNetworkPolicy:
                                apiRegion.services.defaultConfiguration?.networkPolicy,
                            kubernetesClusterDomain: apiRegion.services.expose.domain,
                            ingressClassName: apiRegion.services.expose.ingressClassName,
                            ingress: apiRegion.services.expose.ingress,
                            route: apiRegion.services.expose.route,
                            customValues: apiRegion.services.customValues,
                            istio: apiRegion.services.expose.istio,
                            initScriptUrl: apiRegion.services.initScript,
                            ...(() => {
                                const s3Configs_api = (() => {
                                    const value = apiRegion.data?.S3;

                                    if (value === undefined) {
                                        return [];
                                    }

                                    if (value instanceof Array) {
                                        return value;
                                    }

                                    return [value];
                                })();

                                const s3ConfigCreationFormDefaults: DeploymentRegion["s3ConfigCreationFormDefaults"] =
                                    (() => {
                                        const s3Config_api = (() => {
                                            config_without_sts: {
                                                const s3Config_api = s3Configs_api.find(
                                                    s3Config_api =>
                                                        s3Config_api.sts === undefined
                                                );

                                                if (s3Config_api === undefined) {
                                                    break config_without_sts;
                                                }

                                                return s3Config_api;
                                            }

                                            if (s3Configs_api.length === 0) {
                                                return undefined;
                                            }

                                            const [s3Config_api] = s3Configs_api;

                                            return s3Config_api;
                                        })();

                                        if (s3Config_api === undefined) {
                                            return undefined;
                                        }

                                        return {
                                            url: s3Config_api.URL,
                                            pathStyleAccess:
                                                s3Config_api.pathStyleAccess ?? true,
                                            region: s3Config_api.region,
                                            workingDirectory:
                                                s3Config_api.workingDirectory
                                        };
                                    })();

                                const s3Configs: DeploymentRegion["s3Configs"] =
                                    s3Configs_api
                                        .map(({ sts, workingDirectory, ...rest }) => {
                                            if (sts === undefined) {
                                                return undefined;
                                            }
                                            assert(
                                                workingDirectory !== undefined,
                                                "If region.data.S3.sts is not undefined workingDirectory must be specified"
                                            );

                                            return {
                                                sts,
                                                workingDirectory,
                                                ...rest
                                            };
                                        })
                                        .filter(exclude(undefined))
                                        .map(s3Config_api => ({
                                            url: s3Config_api.URL,
                                            pathStyleAccess:
                                                s3Config_api.pathStyleAccess ?? true,
                                            region: s3Config_api.region,
                                            sts: {
                                                url: s3Config_api.sts.URL,
                                                durationSeconds:
                                                    s3Config_api.sts.durationSeconds,
                                                role: s3Config_api.sts.role,
                                                oidcParams:
                                                    apiTypesOidcConfigurationToOidcParams_Partial(
                                                        s3Config_api.sts.oidcConfiguration
                                                    )
                                            },
                                            workingDirectory:
                                                s3Config_api.workingDirectory,
                                            bookmarkedDirectory:
                                                s3Config_api.bookmarkedDirectory
                                        }));

                                return {
                                    s3Configs,
                                    s3ConfigCreationFormDefaults
                                };
                            })(),
                            allowedURIPatternForUserDefinedInitScript:
                                apiRegion.services.allowedURIPattern,
                            kafka: (() => {
                                const { kafka } =
                                    apiRegion.services.defaultConfiguration ?? {};

                                if (kafka === undefined) {
                                    return undefined;
                                }
                                const { URL, topicName } = kafka;

                                return { url: URL, topicName };
                            })(),
                            tolerations:
                                apiRegion.services?.defaultConfiguration?.tolerations,
                            from: apiRegion.services?.defaultConfiguration?.from,
                            nodeSelector:
                                apiRegion.services.defaultConfiguration?.nodeSelector,
                            startupProbe:
                                apiRegion.services.defaultConfiguration?.startupProbe,
                            vault:
                                apiRegion.vault === undefined
                                    ? undefined
                                    : {
                                          url: apiRegion.vault.URL,
                                          kvEngine: apiRegion.vault.kvEngine,
                                          role: apiRegion.vault.role,
                                          authPath: apiRegion.vault.authPath,
                                          oidcParams:
                                              apiTypesOidcConfigurationToOidcParams_Partial(
                                                  apiRegion.vault.oidcConfiguration
                                              )
                                      },
                            proxyInjection:
                                apiRegion.proxyInjection === undefined
                                    ? undefined
                                    : {
                                          enabled: apiRegion.proxyInjection.enabled,
                                          httpProxyUrl:
                                              apiRegion.proxyInjection.httpProxyUrl,
                                          httpsProxyUrl:
                                              apiRegion.proxyInjection.httpsProxyUrl,
                                          noProxy: apiRegion.proxyInjection.noProxy
                                      },
                            packageRepositoryInjection:
                                apiRegion.packageRepositoryInjection,
                            certificateAuthorityInjection:
                                apiRegion.certificateAuthorityInjection,
                            kubernetes: (() => {
                                const { k8sPublicEndpoint } = apiRegion.services;

                                if (k8sPublicEndpoint?.URL === undefined) {
                                    return undefined;
                                }

                                return {
                                    url: k8sPublicEndpoint.URL,
                                    oidcParams:
                                        apiTypesOidcConfigurationToOidcParams_Partial(
                                            k8sPublicEndpoint.oidcConfiguration
                                        )
                                };
                            })(),
                            sliders:
                                apiRegion.services.defaultConfiguration?.sliders ?? {},
                            resources: apiRegion.services.defaultConfiguration?.resources,
                            certManager: {
                                useCertManager:
                                    apiRegion.services.expose.certManager
                                        ?.useCertManager ?? false,
                                certManagerClusterIssuer:
                                    apiRegion.services.expose.certManager
                                        ?.certManagerClusterIssuer
                            },
                            openshiftSCC:
                                apiRegion.services.openshiftSCC === undefined
                                    ? undefined
                                    : {
                                          scc: apiRegion.services.openshiftSCC.scc,
                                          enabled: apiRegion.services.openshiftSCC.enabled
                                      }
                        })
                );

                return { regions, oidcParams };
            },
            { promise: true }
        ),
        getCatalogsAndCharts: memoize(
            async () => {
                const data = await getApiCatalogsMemo();

                return {
                    catalogs: data.catalogs
                        .map(apiCatalog => ({
                            apiCatalog,
                            visibility: (() => {
                                if (
                                    !apiCatalog.visible.project &&
                                    !apiCatalog.visible.user
                                ) {
                                    return undefined;
                                }

                                if (
                                    apiCatalog.visible.project &&
                                    apiCatalog.visible.user
                                ) {
                                    return "always" as const;
                                }

                                if (apiCatalog.visible.project) {
                                    return "only in groups projects" as const;
                                }

                                return "ony in personal projects" as const;
                            })()
                        }))
                        .map(({ apiCatalog, visibility }) =>
                            visibility === undefined
                                ? undefined
                                : { apiCatalog, visibility }
                        )
                        .filter(exclude(undefined))
                        .map(
                            ({ apiCatalog, visibility }): Catalog => ({
                                id: apiCatalog.id,
                                name: apiCatalog.name ?? apiCatalog.id,
                                repositoryUrl: apiCatalog.location,
                                description: apiCatalog.description,
                                isProduction: apiCatalog.status === "PROD",
                                visibility
                            })
                        ),
                    chartsByCatalogId: Object.fromEntries(
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

                            const charts = Object.entries(catalog.latestPackages)
                                .filter(([, { type }]) => type !== "library")
                                .map(
                                    ([name, { description, home, icon }]): Chart => ({
                                        name,
                                        description,
                                        iconUrl: icon,
                                        projectHomepageUrl: home
                                    })
                                )
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
            { promise: true }
        ),
        getChartAvailableVersions: (() => {
            const memoizedImplementation = memoize(
                async (catalogId: string, chartName: string) => {
                    const { data } = await axiosInstance.get<
                        ApiTypes["/my-lab/catalogs/${catalogId}/charts/${chartName}"]
                    >(`/my-lab/catalogs/${catalogId}/charts/${chartName}`);

                    return (
                        data
                            .map(({ version }) => version)
                            // Most recent version first
                            .sort((a, b) => compareVersions(b, a))
                    );
                },
                { promise: true }
            );

            return async ({ catalogId, chartName }) =>
                memoizedImplementation(catalogId, chartName);
        })(),
        onboard: async ({ group }) => {
            try {
                await axiosInstance.post("/onboarding", { group });
            } catch (error) {
                assert(is<any>(error));

                if (error.response?.status === 409) {
                    //NOTE: The onboarding has already been done.
                    console.log(
                        "^ The project onboarding has already been done, the above 409 is normal"
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
        getHelmChartDetails: (() => {
            const memoizedImplementation = memoize(
                async (catalogId: string, chartName: string, chartVersion: string) => {
                    const [{ data: helmValuesSchemaOrEmptyString }, apiCatalogs] =
                        await Promise.all([
                            axiosInstance.get<
                                ApiTypes["/my-lab/schemas/${catalogId}/charts/${chartName}/versions/${chartVersion}"]
                            >(
                                `/my-lab/schemas/${catalogId}/charts/${chartName}/versions/${chartVersion}`
                            ),
                            getApiCatalogsMemo()
                        ] as const);

                    const helmValuesSchema: JSONSchema | undefined = (() => {
                        if (helmValuesSchemaOrEmptyString === "") {
                            return undefined;
                        }

                        zJSONSchema.parse(helmValuesSchemaOrEmptyString);

                        return helmValuesSchemaOrEmptyString;
                    })();

                    const apiChart = (() => {
                        const entry = apiCatalogs.catalogs.find(c => c.id === catalogId);

                        assert(entry !== undefined);

                        const apiChart = entry.catalog.latestPackages[chartName];

                        assert(apiChart !== undefined);

                        return apiChart;
                    })();

                    return {
                        helmValuesSchema,
                        helmValuesYaml: apiChart.defaultValues,
                        helmChartSourceUrls: apiChart.sources ?? [],
                        helmDependencies: (apiChart.dependencies ?? []).map(
                            ({ name, repository, version, condition }) => ({
                                helmRepositoryUrl: repository,
                                chartName: name,
                                chartVersion: version,
                                condition:
                                    condition === undefined
                                        ? undefined
                                        : condition.split(".").map(segment => {
                                              const x = parseInt(segment);
                                              return isNaN(x) ? segment : x;
                                          })
                            })
                        )
                    };
                },
                { promise: true }
            );

            return async ({ catalogId, chartName, chartVersion }) =>
                memoizedImplementation(catalogId, chartName, chartVersion);
        })(),
        helmInstall: async ({
            helmReleaseName,
            catalogId,
            chartName,
            chartVersion,
            friendlyName,
            isShared,
            values
        }) => {
            await axiosInstance.put("/my-lab/app", {
                catalogId,
                packageName: chartName,
                packageVersion: chartVersion,
                name: helmReleaseName,
                friendlyName,
                share: isShared ?? false,
                options: values,
                dryRun: false
            });

            const installTime = Date.now();

            while (true) {
                try {
                    await axiosInstance.get("/my-lab/app", {
                        params: { serviceId: helmReleaseName }
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
        changeHelmReleaseFriendlyName: ({ helmReleaseName, friendlyName }) =>
            axiosInstance.post("/my-lab/app/rename", {
                serviceID: helmReleaseName,
                friendlyName
            }),
        changeHelmReleaseSharedStatus: ({ helmReleaseName, isShared }) =>
            axiosInstance.post("/my-lab/app/share", {
                serviceID: helmReleaseName,
                share: isShared
            }),
        listHelmReleases: async () => {
            const { data } =
                await axiosInstance.get<ApiTypes["/my-lab/services"]>("/my-lab/services");

            const helmReleases = data.apps.map((apiApp): HelmRelease => {
                const { chartName, chartVersion } = (() => {
                    const [chartName] = apiApp.chart.split(/-\d+\.\d+\.\d+/);

                    const [, chartVersion] = apiApp.chart.split(`${chartName}-`);

                    return {
                        chartName,
                        chartVersion
                    };
                })();

                const isShared = (() => {
                    if (getCurrentProjectId() === undefined) {
                        return undefined;
                    }

                    // TODO: Remove this block in a few months
                    {
                        const shared = id<Record<string, string | undefined>>(apiApp.env)[
                            "onyxia.shared"
                        ];

                        if (shared !== undefined) {
                            return shared === "true";
                        }
                    }

                    return apiApp.share;
                })();

                const friendlyName = (() => {
                    // TODO: Remove this block in a few months
                    value_from_env: {
                        const valueFromEnv = id<Record<string, string | undefined>>(
                            apiApp.env
                        )["onyxia.friendlyName"];

                        if (valueFromEnv === undefined) {
                            break value_from_env;
                        }

                        if (valueFromEnv === chartName) {
                            break value_from_env;
                        }

                        return valueFromEnv;
                    }

                    return apiApp.friendlyName;
                })();

                const ownerUsername = (() => {
                    // TODO: Remove this block in a few months
                    value_from_env: {
                        const valueFromEnv = id<Record<string, string | undefined>>(
                            apiApp.env
                        )["onyxia.owner"];

                        if (valueFromEnv === undefined) {
                            break value_from_env;
                        }

                        if (valueFromEnv === chartName) {
                            break value_from_env;
                        }

                        return valueFromEnv;
                    }

                    return apiApp.owner;
                })();

                return {
                    helmReleaseName: apiApp.id,
                    friendlyName,
                    catalogId: apiApp.catalogId,
                    postInstallInstructions: apiApp.postInstallInstructions,
                    urls: apiApp.urls,
                    startedAt: apiApp.startedAt,
                    values: apiApp.env,
                    appVersion: apiApp.appVersion,
                    revision: apiApp.revision,
                    chartName,
                    chartVersion,
                    ownerUsername,
                    isShared,
                    areAllTasksReady:
                        apiApp.tasks.length !== 0 &&
                        apiApp.tasks[0].containers.length !== 0 &&
                        apiApp.tasks[0].containers.every(({ ready }) => ready),
                    status: apiApp.status,
                    podNames: apiApp.tasks.map(({ id }) => id),
                    doesSupportSuspend: apiApp.suspendable,
                    isSuspended: apiApp.suspended
                };
            });

            return helmReleases;
        },
        helmUninstall: async ({ helmReleaseName }) => {
            const { data } = await axiosInstance.delete<{ success: boolean }>(
                `/my-lab/app`,
                { params: { path: helmReleaseName } }
            );

            //TODO: Wrong assertion here once, investigate
            //Deleted one service just running, deleted all the others.
            assert(data.success, "Helm release uninstall failed");
        },
        getUserAndProjects: memoize(
            async () => {
                const { data } =
                    await axiosInstance.get<ApiTypes["/user/info"]>("/user/info");

                const projects = data.projects.map(
                    (apiProject): Project => ({
                        id: apiProject.id,
                        name: apiProject.name,
                        group: apiProject.group,
                        namespace: apiProject.namespace,
                        vaultTopDir: apiProject.vaultTopDir
                    })
                );

                assert(
                    projects.filter(project => project.group === undefined).length === 1,
                    "There should be only one project without group (user project)"
                );

                const user: User = {
                    username: data.idep,
                    email: data.email,
                    ...(() => {
                        if (data.nomComplet === undefined) {
                            return {
                                firstName: undefined,
                                familyName: undefined
                            };
                        }

                        const [firstName, familyName] = data.nomComplet.split(" ");

                        if (familyName === undefined) {
                            return {
                                firstName: data.nomComplet,
                                familyName: undefined
                            };
                        }

                        return {
                            firstName,
                            familyName
                        };
                    })()
                };

                return { user, projects };
            },
            { promise: true }
        ),
        getQuotas: async () => {
            let resp;

            try {
                resp =
                    await axiosInstance.get<ApiTypes["/my-lab/quota"]>("/my-lab/quota");
            } catch (error) {
                assert(is<any>(error));

                if (error.response?.status === 403) {
                    return undefined;
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

                        return [key, { spec: value, usage: usageValue }];
                    })
                    .filter(exclude(undefined))
            );
        },
        kubectlLogs: async ({ helmReleaseName, podName }) => {
            const { data } = await axiosInstance.get<string>("/my-lab/app/logs", {
                params: {
                    serviceId: helmReleaseName,
                    taskId: podName
                }
            });

            return data;
        },
        subscribeToClusterEvents: async params => {
            const { onNewEvent } = params;
            const ctxUnsubscribe = Evt.newCtx();
            const evtUnsubscribe = params.evtUnsubscribe.pipe(ctxUnsubscribe);

            const response = await fetch(`${url}/my-lab/events`, {
                headers: await getHeaders()
            })
                // NOTE: This happens when there's no data to read.
                .catch(() => undefined);

            if (response === undefined) {
                return;
            }

            if (evtUnsubscribe.postCount !== 0) {
                return;
            }

            assert(response.body !== null);

            const reader = response.body.getReader();

            evtUnsubscribe.attachOnce(() => {
                reader.cancel();
            });

            let rest = "";

            while (true) {
                let result;

                try {
                    result = await reader.read();
                } catch (error) {
                    break;
                }

                if (evtUnsubscribe.postCount !== 0) {
                    break;
                }

                const { done, value } = result;

                if (done) {
                    break;
                }
                // Convert Uint8Array to string assuming UTF-8 encoding
                const chunk = new TextDecoder("utf-8").decode(value);

                `${rest}${chunk}`.split("\n\n").forEach((part, index, parts) => {
                    if (index === parts.length - 1) {
                        rest = part;
                        return;
                    }

                    let event: ApiTypes["/my-lab/events"];
                    try {
                        event = JSON.parse(part.slice("data:".length));
                    } catch (error) {
                        console.error("Failed to parse cluster event:", error, part);
                        return;
                    }

                    onNewEvent({
                        eventId: event.metadata.uid,
                        message: event.message,
                        timestamp: new Date(event.metadata.creationTimestamp).getTime(),
                        severity: (() => {
                            switch (event.type) {
                                case "Normal":
                                    return "info";
                                case "Warning":
                                    return "warning";
                                case "Error":
                                    return "error";
                                default:
                                    return "info";
                            }
                        })(),
                        originalEvent: event
                    });
                });
            }

            ctxUnsubscribe.done();

            reader.releaseLock();
        },
        helmUpgradeGlobalSuspend: async ({ helmReleaseName, value }) => {
            if (value === true) {
                await axiosInstance.post("/my-lab/app/suspend", {
                    serviceID: helmReleaseName
                });
            } else {
                await axiosInstance.post("/my-lab/app/resume", {
                    serviceID: helmReleaseName
                });
            }
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

function apiTypesOidcConfigurationToOidcParams_Partial(
    oidcConfiguration: Partial<ApiTypes.OidcConfiguration> | undefined
): OidcParams_Partial {
    return {
        issuerUri: oidcConfiguration?.issuerURI || undefined,
        clientId: oidcConfiguration?.clientID || undefined,
        extraQueryParams_raw: oidcConfiguration?.extraQueryParams || undefined,
        scope_spaceSeparated: oidcConfiguration?.scope || undefined,
        audience: oidcConfiguration?.audience || undefined,
        idleSessionLifetimeInSeconds: (() => {
            const value = oidcConfiguration?.idleSessionLifetimeInSeconds;

            if (value === "" || value === undefined) {
                return undefined;
            }

            if (typeof value === "number") {
                return value;
            }

            return parseInt(value);
        })()
    };
}
