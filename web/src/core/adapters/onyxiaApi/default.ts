import {
    type OnyxiaApi,
    type Project,
    type DeploymentRegion,
    type LocalizedString,
    type Catalog,
    type Chart,
    type JSONSchemaObject,
    type JSONSchemaFormFieldDescription,
    type User,
    type HelmRelease,
    onyxiaFriendlyNameFormFieldPath,
    onyxiaIsSharedFormFieldPath
} from "core/ports/OnyxiaApi";
import axios from "axios";
import type { AxiosResponse, AxiosRequestConfig } from "axios";
import memoize from "memoizee";
import Mustache from "mustache";
import { assert } from "tsafe/assert";
import type { Equals } from "tsafe";
import { id } from "tsafe/id";
import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";
import { compareVersions } from "compare-versions";

export function createOnyxiaApi(params: {
    url: string;
    /** undefined if user not logged in */
    getOidcAccessToken: () => string | undefined;
    getRegionId: () => string | undefined;
    getProject: () => Pick<Project, "id" | "group"> | undefined;
}): OnyxiaApi {
    const { url, getOidcAccessToken, getRegionId, getProject } = params;

    const { axiosInstance } = (() => {
        const axiosInstance = axios.create({ "baseURL": url, "timeout": 120_000 });

        if (getOidcAccessToken !== undefined) {
            axiosInstance.interceptors.request.use(config => ({
                ...(config as any),
                "headers": {
                    ...config.headers,
                    ...(() => {
                        const accessToken = getOidcAccessToken();

                        if (accessToken === undefined) {
                            return {};
                        }

                        return {
                            "Authorization": `Bearer ${accessToken}`
                        };
                    })()
                },
                "Content-Type": "application/json;charset=utf-8",
                "Accept": "application/json;charset=utf-8"
            }));
        }

        axiosInstance.interceptors.request.use(config => ({
            ...config,
            "headers": {
                ...config?.headers,
                "ONYXIA-REGION": getRegionId(),
                "ONYXIA-PROJECT": getProject()?.id
            }
        }));

        return { axiosInstance };
    })();

    const onyxiaApi: OnyxiaApi = {
        "getIp": memoize(() =>
            axiosInstance.get<{ ip: string }>("/public/ip").then(({ data }) => data.ip)
        ),
        "getAvailableRegionsAndOidcParams": memoize(() =>
            axiosInstance
                .get<{
                    build: {
                        version: string;
                    };
                    regions: {
                        id: string;
                        services: {
                            allowedURIPattern: string;
                            expose: {
                                domain: string;
                                ingressClassName: string;
                                ingress?: boolean;
                                route?: boolean;
                                istio?: {
                                    enabled: boolean;
                                    gateways: string[];
                                };
                            };
                            defaultConfiguration?: {
                                ipprotection?: boolean;
                                networkPolicy?: boolean;
                                kafka?: {
                                    URL: string;
                                    topicName: string;
                                };
                                from?: unknown[];
                                tolerations?: unknown[];
                                nodeSelector?: Record<string, unknown>;
                                startupProbe:
                                    | {
                                          failureThreshold?: number;
                                          initialDelaySeconds?: number;
                                          periodSeconds?: number;
                                          successThreshold?: number;
                                          timeoutSeconds?: number;
                                      }
                                    | undefined;
                                sliders?: Record<
                                    string,
                                    {
                                        sliderMin: number;
                                        sliderMax: number;
                                        sliderStep: number;
                                        sliderUnit: string;
                                    }
                                >;
                                resources?: {
                                    cpuRequest?: `${number}${string}`;
                                    cpuLimit?: `${number}${string}`;
                                    memoryRequest?: `${number}${string}`;
                                    memoryLimit?: `${number}${string}`;
                                    disk?: `${number}${string}`;
                                    gpu?: `${number}`;
                                };
                            };
                            monitoring?: {
                                URLPattern?: string;
                                //"https://grafana.lab.sspcloud.fr/d/kYYgRWBMz/users-services?orgId=1&refresh=5s&var-namespace=$NAMESPACE&var-instance=$INSTANCE"
                            };
                            initScript: string;
                            k8sPublicEndpoint: {
                                oidcConfiguration?: {
                                    issuerURI?: string;
                                    clientID: string;
                                };
                                URL?: string;
                            };
                        };
                        data?: {
                            S3?: {
                                monitoring?: {
                                    URLPattern: string;
                                };
                                oidcConfiguration?: {
                                    issuerURI?: string;
                                    clientID: string;
                                };
                                defaultDurationSeconds?: number;
                            } & (
                                | {
                                      type: "minio";
                                      URL: string;
                                      region?: string;
                                  }
                                | {
                                      type: "amazon";
                                      region: string;
                                      roleARN: string;
                                      roleSessionName: string;
                                  }
                            );
                        };
                        vault?: {
                            URL: string;
                            kvEngine: string;
                            role: string;
                            authPath?: string;
                            oidcConfiguration?: {
                                issuerURI?: string;
                                clientID: string;
                            };
                        };
                        proxyInjection?: {
                            httpProxyUrl: string;
                            httpsProxyUrl: string;
                            noProxy: string;
                        };
                        packageRepositoryInjection?: {
                            cranProxyUrl: string;
                            condaProxyUrl: string;
                            packageManagerUrl: string;
                            pypiProxyUrl: string;
                        };

                        certificateAuthorityInjection?: {
                            cacerts: string;
                            pathToCaBundle: string;
                        };
                    }[];
                    oidcConfiguration?: {
                        issuerURI: string;
                        clientID: string;
                    };
                }>("/public/configuration")
                .then(({ data }) => {
                    const { version } = data.build;
                    console.log(
                        [
                            `inseefrlab/onyxia-api version ${version}`,
                            `https://github.com/InseeFrLab/onyxia-api/tree/${version}`
                        ].join("\n")
                    );
                    return data;
                })
                .then(data => ({
                    "regions": data.regions.map(
                        (region): DeploymentRegion => ({
                            "id": region.id,
                            "servicesMonitoringUrlPattern":
                                region.services.monitoring?.URLPattern,
                            "defaultIpProtection":
                                region.services.defaultConfiguration?.ipprotection,
                            "defaultNetworkPolicy":
                                region.services.defaultConfiguration?.networkPolicy,
                            "kubernetesClusterDomain": region.services.expose.domain,
                            "ingressClassName": region.services.expose.ingressClassName,
                            "ingress": region.services.expose.ingress,
                            "route": region.services.expose.route,
                            "istio": region.services.expose.istio,
                            "initScriptUrl": region.services.initScript,
                            "s3": (() => {
                                const { S3 } = region.data ?? {};

                                if (S3 === undefined) {
                                    return undefined;
                                }

                                const common: DeploymentRegion.S3.Common = {
                                    "monitoringUrlPattern": S3.monitoring?.URLPattern,
                                    "defaultDurationSeconds": S3.defaultDurationSeconds,
                                    "oidcParams":
                                        S3.oidcConfiguration === undefined
                                            ? undefined
                                            : {
                                                  "issuerUri":
                                                      S3.oidcConfiguration.issuerURI,
                                                  "clientId":
                                                      S3.oidcConfiguration.clientID
                                              }
                                };

                                return (() => {
                                    switch (S3.type) {
                                        case "minio":
                                            _s3url = S3.URL;
                                            return id<DeploymentRegion.S3.Minio>({
                                                "type": "minio",
                                                "url": S3.URL,
                                                "region": S3.region,
                                                ...common
                                            });
                                        case "amazon":
                                            _s3url = "https://s3.amazonaws.com";
                                            return id<DeploymentRegion.S3.Amazon>({
                                                "type": "amazon",
                                                "region": S3.region,
                                                "roleARN": S3.roleARN,
                                                "roleSessionName": S3.roleSessionName,
                                                ...common
                                            });
                                    }
                                })();
                            })(),
                            "allowedURIPatternForUserDefinedInitScript":
                                region.services.allowedURIPattern,
                            "kafka": (() => {
                                const { kafka } =
                                    region.services.defaultConfiguration ?? {};

                                if (kafka === undefined) {
                                    return undefined;
                                }
                                const { URL, topicName } = kafka;

                                return { "url": URL, topicName };
                            })(),
                            "from": region.services?.defaultConfiguration?.from,
                            "tolerations":
                                region.services?.defaultConfiguration?.tolerations,
                            "nodeSelector":
                                region.services.defaultConfiguration?.nodeSelector,
                            "startupProbe":
                                region.services.defaultConfiguration?.startupProbe,
                            "vault": (() => {
                                const { vault } = region;
                                return vault === undefined
                                    ? undefined
                                    : {
                                          "url": vault.URL,
                                          "kvEngine": vault.kvEngine,
                                          "role": vault.role,
                                          "authPath": vault.authPath,
                                          "oidcParams":
                                              vault.oidcConfiguration === undefined
                                                  ? undefined
                                                  : {
                                                        "issuerUri":
                                                            vault.oidcConfiguration
                                                                .issuerURI,
                                                        "clientId":
                                                            vault.oidcConfiguration
                                                                .clientID
                                                    }
                                      };
                            })(),
                            "proxyInjection": region.proxyInjection,
                            "packageRepositoryInjection":
                                region.packageRepositoryInjection,
                            "certificateAuthorityInjection":
                                region.certificateAuthorityInjection,
                            "kubernetes": (() => {
                                const { k8sPublicEndpoint } = region.services;
                                return k8sPublicEndpoint?.URL === undefined
                                    ? undefined
                                    : {
                                          "url": k8sPublicEndpoint.URL,
                                          "oidcParams":
                                              k8sPublicEndpoint.oidcConfiguration ===
                                              undefined
                                                  ? undefined
                                                  : {
                                                        "issuerUri":
                                                            k8sPublicEndpoint
                                                                .oidcConfiguration
                                                                .issuerURI,
                                                        "clientId":
                                                            k8sPublicEndpoint
                                                                .oidcConfiguration
                                                                .clientID
                                                    }
                                      };
                            })(),
                            "sliders":
                                region.services.defaultConfiguration?.sliders ?? {},
                            "resources": region.services.defaultConfiguration?.resources
                        })
                    ),
                    "oidcParams":
                        data.oidcConfiguration === undefined
                            ? undefined
                            : {
                                  "issuerUri": data.oidcConfiguration.issuerURI,
                                  "clientId": data.oidcConfiguration.clientID
                              }
                }))
                .catch(onError)
        ),
        "getCatalogsAndCharts": memoize(
            async () => {
                const { catalogs: apiCatalogs } = await axiosInstance
                    .get<{
                        catalogs: {
                            id: string;
                            name: LocalizedString;
                            location: string;
                            description: LocalizedString;
                            status: "PROD" | "TEST";
                            catalog: {
                                entries: Record<
                                    string,
                                    {
                                        description?: string;
                                        version: string;
                                        type: "library" | "application";
                                        icon?: string | undefined;
                                        home?: string | undefined;
                                    }[]
                                >;
                            };
                            highlightedCharts?: string[];
                        }[];
                    }>("/public/catalogs")
                    .catch(onError)
                    .then(({ data }) => data);

                return {
                    "catalogs": apiCatalogs.map(
                        ({ id, name, location, description, status }): Catalog => ({
                            id,
                            name,
                            "repositoryUrl": location,
                            description,
                            "isHidden": status !== "PROD"
                        })
                    ),
                    "chartsByCatalogId": Object.fromEntries(
                        apiCatalogs.map(
                            ({ id: catalogId, catalog, highlightedCharts = [] }) => {
                                function getChartWeight(chartName: string) {
                                    const indexHighlightedCharts =
                                        highlightedCharts.findIndex(
                                            v =>
                                                v.toLowerCase() ===
                                                chartName.toLowerCase()
                                        );
                                    return indexHighlightedCharts !== -1
                                        ? highlightedCharts.length -
                                              indexHighlightedCharts
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
                            }
                        )
                    )
                };
            },
            { "promise": true }
        ),
        "onboard": () =>
            axiosInstance
                .post("/onboarding", {
                    "group": (() => {
                        const project = getProject();
                        assert(project !== undefined);
                        return project.group;
                    })()
                })
                .catch(error => {
                    if (error.response?.status === 409) {
                        //NOTE: The onboarding has already been done.
                        return;
                    }

                    if (error.response?.status === 400) {
                        //This happens in mono namespace.
                        //DODO: Decide if we want to keep this error code.
                        return;
                    }

                    throw error;
                })
                .catch(onError)
                .then(() => undefined),
        "getHelmChartDetails": ({ catalogId, chartName, chartVersion }) =>
            axiosInstance
                .get<{
                    config: JSONSchemaObject;
                    sources?: string[];
                    dependencies?: {
                        name: string;
                    }[];
                }>(
                    `/public/catalogs/${catalogId}/charts/${chartName}/versions/${chartVersion}`
                )
                .then(
                    ({ data }) => ({
                        "dependencies": data.dependencies?.map(({ name }) => name) ?? [],
                        "sourceUrls": data.sources ?? [],
                        "getChartValuesSchemaJson": ({ xOnyxiaContext }) => {
                            //WARNING: The type is not exactly correct here. JSONSchemaFormFieldDescription["default"] can be undefined.
                            const configCopy = JSON.parse(
                                JSON.stringify(data.config)
                            ) as JSONSchemaObject;

                            function overrideDefaultsRec(
                                jsonSchemaObjectOrFormFieldDescription:
                                    | JSONSchemaObject
                                    | JSONSchemaFormFieldDescription,
                                path: string
                            ) {
                                if (
                                    jsonSchemaObjectOrFormFieldDescription.type ===
                                        "object" &&
                                    "properties" in jsonSchemaObjectOrFormFieldDescription
                                ) {
                                    const jsonSchemaObject =
                                        jsonSchemaObjectOrFormFieldDescription;
                                    Object.entries(jsonSchemaObject.properties).forEach(
                                        ([key, value]) =>
                                            overrideDefaultsRec(value, `${path}.${key}`)
                                    );
                                    return;
                                }

                                const jsonSchemaFormFieldDescription =
                                    jsonSchemaObjectOrFormFieldDescription;

                                overwrite_default: {
                                    const assertWeHaveADefault = () => {
                                        //NOTE: Actually, the default can be undefined in the value.schema.json
                                        //      but it would be too complicated to specify in the type system
                                        //      thus the any.
                                        if (
                                            (jsonSchemaFormFieldDescription.default as any) !==
                                            undefined
                                        ) {
                                            return;
                                        }

                                        if (
                                            jsonSchemaFormFieldDescription.type ===
                                            "string"
                                        ) {
                                            jsonSchemaFormFieldDescription.default = "";
                                            return;
                                        }

                                        if (
                                            jsonSchemaFormFieldDescription.type ===
                                            "object"
                                        ) {
                                            jsonSchemaFormFieldDescription.default = {};
                                            return;
                                        }

                                        if (
                                            jsonSchemaFormFieldDescription.type ===
                                            "array"
                                        ) {
                                            jsonSchemaFormFieldDescription.default = [];
                                            return;
                                        }

                                        assert(false, `${path} has no default value`);
                                    };

                                    const { overwriteDefaultWith } =
                                        jsonSchemaFormFieldDescription["x-onyxia"] ?? {};

                                    if (overwriteDefaultWith === undefined) {
                                        assertWeHaveADefault();
                                        break overwrite_default;
                                    }

                                    const resolvedValue = overwriteDefaultWith.includes(
                                        "{{"
                                    )
                                        ? Mustache.render(
                                              overwriteDefaultWith
                                                  .replace(/{{/g, "{{{")
                                                  .replace(/}}/g, "}}}"),
                                              xOnyxiaContext
                                          )
                                        : getValueAtPathInObject({
                                              "path": overwriteDefaultWith.split("."),
                                              "obj": xOnyxiaContext
                                          });

                                    if (
                                        resolvedValue === undefined ||
                                        resolvedValue === null
                                    ) {
                                        assertWeHaveADefault();
                                        break overwrite_default;
                                    }

                                    switch (jsonSchemaFormFieldDescription.type) {
                                        case "string":
                                            jsonSchemaFormFieldDescription.default =
                                                typeof resolvedValue !== "object"
                                                    ? `${resolvedValue}`
                                                    : JSON.stringify(resolvedValue);
                                            break;
                                        case "array":
                                            assert(
                                                resolvedValue instanceof Array,
                                                `${overwriteDefaultWith} is not an array (${path})`
                                            );
                                            jsonSchemaFormFieldDescription.default =
                                                resolvedValue;
                                            break;
                                        case "object":
                                            assert(
                                                resolvedValue instanceof Object,
                                                `${overwriteDefaultWith} is not an object (${path})`
                                            );
                                            jsonSchemaFormFieldDescription.default =
                                                resolvedValue;
                                            break;
                                        case "boolean":
                                            assert(
                                                typeof resolvedValue !== "object",
                                                `${overwriteDefaultWith} resolved to an object, it can't be interpreted as a boolean (${path})`
                                            );

                                            const trueishStrings = [
                                                "true",
                                                "1",
                                                "yes",
                                                "y"
                                            ];
                                            const falseishStrings = [
                                                "false",
                                                "0",
                                                "no",
                                                "n"
                                            ];

                                            if (typeof resolvedValue === "string") {
                                                assert(
                                                    [
                                                        ...trueishStrings,
                                                        ...falseishStrings
                                                    ].includes(
                                                        resolvedValue.toLowerCase()
                                                    ),
                                                    [
                                                        `${overwriteDefaultWith} resolves to a string that can't be interpreted as a boolean (${path})`,
                                                        `strings that can be interpreted as boolean are: (case insensitive)`,
                                                        [
                                                            ...trueishStrings,
                                                            ...falseishStrings
                                                        ].join(" "),
                                                        `You resolved to: ${resolvedValue}`
                                                    ].join("\n")
                                                );
                                            }

                                            jsonSchemaFormFieldDescription.default =
                                                typeof resolvedValue === "string"
                                                    ? trueishStrings.includes(
                                                          resolvedValue.toLowerCase()
                                                      )
                                                    : !!resolvedValue;
                                            break;
                                        case "number":
                                        case "integer":
                                            {
                                                const x = (() => {
                                                    if (
                                                        typeof resolvedValue === "number"
                                                    ) {
                                                        return resolvedValue;
                                                    }

                                                    const interpretedValue =
                                                        typeof resolvedValue === "string"
                                                            ? parseFloat(resolvedValue)
                                                            : undefined;

                                                    assert(
                                                        interpretedValue !== undefined &&
                                                            !isNaN(interpretedValue),
                                                        `${overwriteDefaultWith} can't be interpreted as a number (${path})`
                                                    );

                                                    return interpretedValue;
                                                })();

                                                jsonSchemaFormFieldDescription.default =
                                                    (() => {
                                                        switch (
                                                            jsonSchemaFormFieldDescription.type
                                                        ) {
                                                            case "number":
                                                                return x;
                                                            case "integer":
                                                                assert(
                                                                    Number.isInteger(x),
                                                                    `${overwriteDefaultWith} (${x}) is not an integer (${path})`
                                                                );
                                                                return x;
                                                        }
                                                    })();
                                            }
                                            break;
                                    }
                                }

                                use_region_slider_config: {
                                    if (
                                        !(
                                            jsonSchemaFormFieldDescription.type ===
                                                "string" &&
                                            "render" in jsonSchemaFormFieldDescription &&
                                            jsonSchemaFormFieldDescription.render ===
                                                "slider"
                                        )
                                    ) {
                                        break use_region_slider_config;
                                    }

                                    const { useRegionSliderConfig } =
                                        jsonSchemaFormFieldDescription["x-onyxia"] ?? {};

                                    if (useRegionSliderConfig === undefined) {
                                        break use_region_slider_config;
                                    }

                                    const sliderConfig = getValueAtPathInObject<
                                        (typeof xOnyxiaContext)["region"]["sliders"][string]
                                    >({
                                        "path": [
                                            "region",
                                            "sliders",
                                            useRegionSliderConfig
                                        ],
                                        "obj": xOnyxiaContext
                                    });

                                    if (sliderConfig === undefined) {
                                        console.warn(
                                            `There is no slider configuration ${useRegionSliderConfig} in the current deployment region`
                                        );
                                        break use_region_slider_config;
                                    }

                                    const {
                                        sliderMax,
                                        sliderMin,
                                        sliderStep,
                                        sliderUnit,
                                        ...rest
                                    } = sliderConfig;

                                    assert<Equals<typeof rest, {}>>();

                                    if (
                                        "sliderExtremity" in
                                        jsonSchemaFormFieldDescription
                                    ) {
                                        switch (
                                            jsonSchemaFormFieldDescription.sliderExtremity
                                        ) {
                                            case "down":
                                                jsonSchemaFormFieldDescription.sliderMin =
                                                    sliderConfig.sliderMin;
                                                jsonSchemaFormFieldDescription.sliderUnit =
                                                    sliderConfig.sliderUnit;
                                                jsonSchemaFormFieldDescription.sliderStep =
                                                    sliderConfig.sliderStep;
                                                break;
                                            case "up":
                                                jsonSchemaFormFieldDescription.sliderMax =
                                                    sliderConfig.sliderMax;
                                                break;
                                        }
                                    } else {
                                        jsonSchemaFormFieldDescription.sliderMax =
                                            sliderConfig.sliderMax;
                                        jsonSchemaFormFieldDescription.sliderMin =
                                            sliderConfig.sliderMin;
                                        jsonSchemaFormFieldDescription.sliderUnit =
                                            sliderConfig.sliderUnit;
                                        jsonSchemaFormFieldDescription.sliderStep =
                                            sliderConfig.sliderStep;
                                    }
                                }
                            }

                            overrideDefaultsRec(configCopy, "");

                            return configCopy;
                        }
                    }),
                    onError
                ),
        "helmInstall": (() => {
            const getMyLab_App = (params: { helmReleaseName: string }) => {
                const { helmReleaseName } = params;
                return axiosInstance
                    .get("/my-lab/app", { "params": { "serviceId": helmReleaseName } })
                    .catch(onError);
            };

            return async ({
                helmReleaseName,
                catalogId,
                chartName,
                chartVersion,
                values
            }) => {
                await axiosInstance
                    .put("/my-lab/app", {
                        catalogId,
                        "packageName": chartName,
                        "packageVersion": chartVersion,
                        "name": helmReleaseName,
                        "options": values,
                        "dryRun": false
                    })
                    .catch(onError);

                while (true) {
                    try {
                        await getMyLab_App({ helmReleaseName });
                        break;
                    } catch {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            };
        })(),
        "listHelmReleases": (() => {
            type Data = {
                apps: {
                    id: string;
                    urls: string[];
                    env: {
                        [onyxiaIsSharedFormFieldPath]: "true" | "false";
                        [onyxiaFriendlyNameFormFieldPath]: string;
                        "onyxia.owner": string;
                        [key: string]: string;
                    };
                    startedAt: number;
                    tasks: {
                        containers: { ready: boolean }[];
                    }[];
                    postInstallInstructions: string | undefined;
                    chart: string;
                    appVersion: string;
                    revision: string;
                }[];
            };

            const getMyLab_Services = memoize(
                () =>
                    axiosInstance
                        .get<Data>("/my-lab/services")
                        .then(({ data }) => data)
                        .catch(onError),
                { "promise": true, "maxAge": 1000 }
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
                        "totalPodCount": containers.length
                    };
                } catch {
                    if (id !== undefined) {
                        console.warn(
                            `Couldn't get the service status from tasks for ${id}`
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

            return async () =>
                (await getMyLab_Services()).apps
                    .map(({ tasks, id, ...rest }) => ({
                        ...rest,
                        id,
                        "areAllPodsRunning": (() => {
                            const podsStatus = getPodsStatus({ tasks, id });

                            return podsStatus === undefined
                                ? false
                                : getAreAllPodsRunning(podsStatus);
                        })()
                    }))
                    .map(
                        ({
                            id,
                            env,
                            urls,
                            startedAt,
                            postInstallInstructions,
                            areAllPodsRunning,
                            chart,
                            appVersion,
                            revision
                        }): HelmRelease => ({
                            "helmReleaseName": id,
                            //TODO: Here also get the catalogId
                            "friendlyName": env["onyxia.friendlyName"],
                            postInstallInstructions,
                            urls,
                            startedAt,
                            env,
                            appVersion,
                            revision,
                            ...(() => {
                                const [chartName] = chart.split(
                                    /-[0-9]+\.[0-9]+\.[0-9]+/
                                );

                                const [, chartVersion] = chart.split(`${chartName}-`);

                                return {
                                    chartName,
                                    chartVersion
                                };
                            })(),
                            "ownerUsername": env["onyxia.owner"],
                            "isShared": env["onyxia.share"] === "true",
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
                                                  "tasks": app.tasks
                                              });

                                              if (podsStatus === undefined) {
                                                  resolve({
                                                      "isConfirmedJustStarted": false
                                                  });

                                                  return;
                                              }

                                              if (!getAreAllPodsRunning(podsStatus)) {
                                                  callee(resolve);
                                                  return;
                                              }

                                              resolve({ "isConfirmedJustStarted": true });
                                          }, 3000);
                                      })
                                  } as const))
                        })
                    );
        })(),
        "helmUninstall": ({ helmReleaseName }) =>
            axiosInstance
                .delete<{ success: boolean }>(`/my-lab/app`, {
                    "params": { "path": helmReleaseName }
                })
                .then(({ data }) => {
                    //TODO: Wrong assertion here once, investigate
                    //Deleted one service just running, deleted all the others.
                    assert(data.success);
                })
                .catch(onError),
        "getUserProjects": memoize(
            () =>
                axiosInstance
                    .get<{
                        projects: {
                            id: string;
                            name: string;
                            group?: string;
                            bucket: string;
                            namespace: string;
                            vaultTopDir: string;
                        }[];
                    }>("/user/info")
                    .then(({ data }) =>
                        data.projects.map(
                            ({ id, name, group, bucket, namespace, vaultTopDir }) => ({
                                id,
                                name,
                                group,
                                bucket,
                                namespace,
                                vaultTopDir
                            })
                        )
                    )
                    .then(projects => {
                        assert(
                            projects.filter(project => project.group === undefined)
                                .length === 1,
                            "There should be only one project without group (user project)"
                        );

                        return projects;
                    })
                    .catch(onError),
            { "promise": true }
        ),
        "createAwsBucket": ({
            awsRegion,
            accessKey,
            secretKey,
            sessionToken,
            bucketName
        }) =>
            axiosInstance
                .post<void>(
                    "/s3",
                    Object.entries({
                        awsRegion,
                        accessKey,
                        secretKey,
                        sessionToken,
                        bucketName
                    })
                        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                        .join("&")
                )
                .then(() => undefined)
                .catch(onError),
        "getUser": memoize(
            async () => {
                const { data } = await axiosInstance
                    .get<{
                        email: string;
                        idep: string;
                        nomComplet: string;
                    }>("/user/info")
                    .catch(onError);

                const [firstName, familyName] = data.nomComplet.split(" ");

                return id<User>({
                    "username": data.idep,
                    "email": data.email,
                    firstName,
                    familyName
                });
            },
            { "promise": true }
        )
    };

    let wasFirstRequestSuccessful = false;

    function onError(
        error: Error & { response?: AxiosResponse; config?: AxiosRequestConfig }
    ): never {
        const { response, config } = error;
        const message =
            config === undefined
                ? String(error)
                : [
                      "Onyxia API Error:",
                      "",
                      `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
                      response === undefined
                          ? error.message === "Network Error"
                              ? "Network Error"
                              : "No response"
                          : `Response: ${response.status} ${response.statusText}`
                  ].join("\n");

        alert(message);

        if (
            !wasFirstRequestSuccessful &&
            !onError.isWarningAboutOnyxiaProbableMisconfigurationShown
        ) {
            onError.isWarningAboutOnyxiaProbableMisconfigurationShown = true;

            alert(
                [
                    "The first request to the Onyxia API failed.",
                    "This usually means that the Onyxia API is not configured correctly.",
                    `Please make sure that onyxia-api is running at:`,
                    url
                ].join("\n")
            );
        }

        throw error;
    }

    onError.isWarningAboutOnyxiaProbableMisconfigurationShown = false;

    const { proxy } = (() => {
        let isFirstRequest = true;

        const proxy = new Proxy<OnyxiaApi>(onyxiaApi, {
            "get": (target, prop) => {
                if (isFirstRequest && typeof prop === "string" && prop in onyxiaApi) {
                    isFirstRequest = false;

                    return async (...args: any[]) => {
                        // @ts-expect-error
                        const out = await onyxiaApi[String(prop)](...args);

                        wasFirstRequestSuccessful = true;

                        return out;
                    };
                }

                return Reflect.get(target, prop);
            }
        });

        return { proxy };
    })();

    return proxy;
}

let _s3url: string | undefined = undefined;

/** @deprecated: hack for legacy */
export function getS3Url() {
    assert(_s3url !== undefined);
    return _s3url;
}
