import type {
    OnyxiaApi,
    DeploymentRegion,
    LocalizedString,
    JSONSchemaObject,
    JSONSchemaFormFieldDescription
} from "../ports/OnyxiaApi";
import axios from "axios";
import type { AxiosResponse, AxiosRequestConfig } from "axios";
import memoize from "memoizee";
import {
    onyxiaFriendlyNameFormFieldPath,
    onyxiaIsSharedFormFieldPath
} from "core/ports/OnyxiaApi";
import Mustache from "mustache";
import { assert } from "tsafe/assert";
import type { Equals } from "tsafe";
import { id } from "tsafe/id";
import {
    type Catalog,
    type Project,
    getRandomK8sSubdomain,
    getServiceId
} from "../ports/OnyxiaApi";
import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";

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

    const onError = (
        error: Error & { response?: AxiosResponse; config?: AxiosRequestConfig }
    ) => {
        const { response, config } = error;

        const message =
            config === undefined
                ? String(error)
                : [
                      "Onyxia API Error:",
                      "",
                      `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
                      response === undefined
                          ? ""
                          : `Response: ${response.status} ${response.statusText}`
                  ].join("\n");

        alert(message);

        throw error;
    };

    const onyxiaApi: OnyxiaApi = {
        "getIp": memoize(() =>
            axiosInstance.get<{ ip: string }>("/public/ip").then(({ data }) => data.ip)
        ),
        "getAvailableRegions": memoize(() =>
            axiosInstance
                .get<{
                    regions: {
                        id: string;
                        services: {
                            allowedURIPattern: string;
                            expose: {
                                domain: string;
                                ingressClassName: string;
                                ingress?: boolean;
                                route?: boolean;
                                istio?: boolean;
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
                                keycloakParams?: {
                                    clientId: string;
                                    realm: string;
                                    URL: string;
                                };
                                URL?: string;
                            };
                        };
                        data?: {
                            S3?: {
                                monitoring?: {
                                    URLPattern: string;
                                };
                                keycloakParams?: {
                                    URL?: string;
                                    realm?: string;
                                    clientId: string;
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
                            keycloakParams?: {
                                URL?: string;
                                realm?: string;
                                clientId: string;
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
                            pypiProxyUrl: string;
                        };

                        certificateAuthorityInjection?: {
                            cacerts: string;
                            pathToCaBundle: string;
                        };
                    }[];
                }>("/public/configuration")
                .then(res => {
                    if (res.headers["content-type"] !== "application/json") {
                        throw new Error(`The is no Onyxia API running at ${url}`);
                    }
                    return res;
                })
                .then(({ data }) =>
                    data.regions.map(
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
                                    "keycloakParams":
                                        S3.keycloakParams === undefined
                                            ? undefined
                                            : {
                                                  "url": S3.keycloakParams.URL,
                                                  "realm": S3.keycloakParams.realm,
                                                  "clientId": S3.keycloakParams.clientId
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
                                          "keycloakParams":
                                              vault.keycloakParams === undefined
                                                  ? undefined
                                                  : {
                                                        "url": vault.keycloakParams.URL,
                                                        "realm":
                                                            vault.keycloakParams.realm,
                                                        "clientId":
                                                            vault.keycloakParams.clientId
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
                                          "keycloakParams":
                                              k8sPublicEndpoint.keycloakParams ===
                                              undefined
                                                  ? undefined
                                                  : {
                                                        "url": k8sPublicEndpoint
                                                            .keycloakParams.URL,
                                                        "realm":
                                                            k8sPublicEndpoint
                                                                .keycloakParams.realm,
                                                        "clientId":
                                                            k8sPublicEndpoint
                                                                .keycloakParams.clientId
                                                    }
                                      };
                            })(),
                            "sliders":
                                region.services.defaultConfiguration?.sliders ?? {},
                            "resources": region.services.defaultConfiguration?.resources
                        })
                    )
                )
                .catch(onError)
        ),
        "getCatalogs": memoize(
            () =>
                axiosInstance
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
                                        description: string;
                                        version: string;
                                        icon: string | undefined;
                                        home: string | undefined;
                                    }[]
                                >;
                            };
                            highlightedCharts: string[];
                        }[];
                    }>("/public/catalogs")
                    .then(({ data }) =>
                        data.catalogs.map(catalog =>
                            id<Catalog>({
                                "id": catalog.id,
                                "name": catalog.name,
                                "location": catalog.location,
                                "description": catalog.description,
                                "status": catalog.status,
                                "charts": Object.entries(catalog.catalog.entries)
                                    .filter(([key]) => key !== "library-chart")
                                    .map(([name, versions]) => ({
                                        name,
                                        versions
                                    })),
                                "highlightedCharts": catalog.highlightedCharts
                            })
                        )
                    )
                    .catch(onError),
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

                    throw error;
                })
                .catch(onError)
                .then(() => undefined),
        "getPackageConfig": ({ catalogId, packageName }) =>
            axiosInstance
                .get<
                    {
                        config: JSONSchemaObject;
                        sources?: string[];
                        dependencies?: {
                            name: string;
                        }[];
                    }[]
                >(`/public/catalogs/${catalogId}/charts/${packageName}`)
                .then(
                    ({ data }) => ({
                        "dependencies":
                            data[0].dependencies?.map(({ name }) => name) ?? [],
                        "sources": data[0].sources ?? [],
                        "getValuesSchemaJson": ({ onyxiaValues }) => {
                            //WARNING: The type is not exactly correct here. JSONSchemaFormFieldDescription["default"] can be undefined.
                            const configCopy = JSON.parse(
                                JSON.stringify(data[0].config)
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
                                              onyxiaValues
                                          )
                                        : getValueAtPathInObject({
                                              "path": overwriteDefaultWith.split("."),
                                              "obj": onyxiaValues
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
                                                `${overwriteDefaultWith} can't be interpreted as a boolean (${path})`
                                            );
                                            jsonSchemaFormFieldDescription.default =
                                                !!resolvedValue;
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
                                        (typeof onyxiaValues)["region"]["sliders"][string]
                                    >({
                                        "path": [
                                            "region",
                                            "sliders",
                                            useRegionSliderConfig
                                        ],
                                        "obj": onyxiaValues
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
        ...(() => {
            const getMyLab_App = (params: { serviceId: string }) =>
                axiosInstance.get("/my-lab/app", { params }).catch(onError);

            const launchPackage = id<OnyxiaApi["launchPackage"]>(
                async ({ catalogId, packageName, options, isDryRun }) => {
                    const { serviceId } = getServiceId({
                        packageName,
                        "randomK8sSubdomain": getRandomK8sSubdomain()
                    });

                    const { data: contract } = await axiosInstance
                        .put<Record<string, unknown>[][]>(`/my-lab/app`, {
                            catalogId,
                            packageName,
                            "name": serviceId,
                            options,
                            "dryRun": isDryRun
                        })
                        .catch(onError);

                    while (true) {
                        try {
                            await getMyLab_App({ serviceId });
                            break;
                        } catch {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }

                    return { contract };
                }
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
                        })()
                    }))
                    .map(
                        ({
                            id,
                            env,
                            urls,
                            startedAt,
                            postInstallInstructions,
                            areAllPodsRunning
                        }) => ({
                            id,
                            ...(() => {
                                //TODO: We shouldn't compute things here.
                                const packageName = id.replace(/-[^-]+$/, "");

                                return {
                                    packageName,
                                    "friendlyName":
                                        env[onyxiaFriendlyNameFormFieldPath] ??
                                        packageName
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

            return { getRunningServices };
        })(),
        "stopService": ({ serviceId }) =>
            axiosInstance
                .delete<{ success: boolean }>(`/my-lab/app`, {
                    "params": { "path": serviceId }
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
                .catch(onError)
    };

    return onyxiaApi;
}

let _s3url: string | undefined = undefined;

/** @deprecated: hack for legacy */
export function getS3Url() {
    assert(_s3url !== undefined);
    return _s3url;
}
