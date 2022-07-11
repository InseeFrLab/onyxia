import type {
    OnyxiaApiClient,
    DeploymentRegion,
    LocalizedString,
} from "../ports/OnyxiaApiClient";
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
import { getRandomK8sSubdomain, getServiceId } from "../ports/OnyxiaApiClient";
import type {
    JSONSchemaObject,
    JSONSchemaFormFieldDescription,
} from "../ports/OnyxiaApiClient";
import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";

/** @deprecated */
const dAxiosInstance = new Deferred<AxiosInstance>();

export const { pr: prAxiosInstance } = dAxiosInstance;

export function createOfficialOnyxiaApiClient(params: {
    url: string;
    /** undefined if user not logged in */
    getOidcAccessToken: (() => string) | undefined;
    //NOTE: We can't know at initialization what region and project is selected.
    //we first have to query the API to know what region and projects are available
    //for the user.
    //We can't do that internally in the adapter as it's not it's its responsibility
    //to decide what region or project should be selected.
    //As consequence, instead of providing simple function that return the currently
    //selected project and region we take a reference of a function (in the like of ReactRefs )
    //that can be updated later on by the caller of the function.
    refGetCurrentlySelectedDeployRegionId: { current: (() => string) | undefined };
    refGetCurrentlySelectedProjectId: { current: (() => string) | undefined };
}): OnyxiaApiClient {
    const {
        url,
        getOidcAccessToken,
        refGetCurrentlySelectedDeployRegionId,
        refGetCurrentlySelectedProjectId,
    } = params;

    const { axiosInstance } = (() => {
        const axiosInstance = axios.create({ "baseURL": url, "timeout": 120_000 });

        if (getOidcAccessToken !== undefined) {
            axiosInstance.interceptors.request.use(
                config => ({
                    ...(config as any),
                    "headers": {
                        ...config.headers,
                        "Authorization": `Bearer ${getOidcAccessToken()}`,
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
                    if (
                        `${res.status}`[0] === "2" &&
                        res.headers["content-type"] !== "application/json"
                    ) {
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

        axiosInstance.interceptors.request.use(config => ({
            ...config,
            "headers": {
                ...config?.headers,
                ...(refGetCurrentlySelectedDeployRegionId.current === undefined
                    ? {}
                    : {
                          "ONYXIA-REGION":
                              refGetCurrentlySelectedDeployRegionId.current(),
                      }),
                ...(refGetCurrentlySelectedProjectId.current === undefined
                    ? {}
                    : {
                          "ONYXIA-PROJECT": refGetCurrentlySelectedProjectId.current(),
                      }),
            },
        }));

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
                            allowedURIPattern: string;
                            expose: { domain: string };
                            defaultConfiguration?: {
                                ipprotection?: boolean;
                                networkPolicy?: boolean;
                                kafka?: {
                                    URL: string;
                                    topicName: string;
                                };
                            };
                            monitoring?: {
                                URLPattern?: string;
                                //"https://grafana.lab.sspcloud.fr/d/kYYgRWBMz/users-services?orgId=1&refresh=5s&var-namespace=$NAMESPACE&var-instance=$INSTANCE"
                            };
                            initScript: string;
                            quotas?: {
                                defaultConfiguration?: {
                                    from?: unknown[];
                                    tolerations?: unknown[];
                                };
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
                    }[];
                }>("/public/configuration")
                .then(({ data }) =>
                    data.regions.map(region => ({
                        "id": region.id,
                        "servicesMonitoringUrlPattern":
                            region.services.monitoring?.URLPattern,
                        "defaultIpProtection":
                            region.services.defaultConfiguration?.ipprotection,
                        "defaultNetworkPolicy":
                            region.services.defaultConfiguration?.networkPolicy,
                        "kubernetesClusterDomain": region.services.expose.domain,
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
                                              "clientId": S3.keycloakParams.clientId,
                                          },
                            };

                            return (() => {
                                switch (S3.type) {
                                    case "minio":
                                        _s3url = S3.URL;
                                        return id<DeploymentRegion.S3.Minio>({
                                            "type": "minio",
                                            "url": S3.URL,
                                            "region": S3.region,
                                            ...common,
                                        });
                                    case "amazon":
                                        _s3url = "https://s3.amazonaws.com";
                                        return id<DeploymentRegion.S3.Amazon>({
                                            "type": "amazon",
                                            "region": S3.region,
                                            "roleARN": S3.roleARN,
                                            "roleSessionName": S3.roleSessionName,
                                            ...common,
                                        });
                                }
                            })();
                        })(),
                        "allowedURIPatternForUserDefinedInitScript":
                            region.services.allowedURIPattern,
                        "kafka": (() => {
                            const { kafka } = region.services.defaultConfiguration ?? {};

                            if (kafka === undefined) {
                                return undefined;
                            }
                            const { URL, topicName } = kafka;

                            return { "url": URL, topicName };
                        })(),
                        "from": region.services.quotas?.defaultConfiguration?.from,
                        "tolerations":
                            region.services.quotas?.defaultConfiguration?.tolerations,
                    })),
                ),
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
        "getPackageConfig": ({ catalogId, packageName }) =>
            axiosInstance
                .get<{
                    config: JSONSchemaObject;
                    sources?: string[];
                    dependencies?: {
                        name: string;
                    }[];
                }>(`/public/catalog/${catalogId}/${packageName}`)
                .then(({ data }) => ({
                    "dependencies": data.dependencies?.map(({ name }) => name) ?? [],
                    "sources": data.sources ?? [],
                    "getValuesSchemaJson": ({ onyxiaValues }) => {
                        //WARNING: The type is not exactly correct here. JSONSchemaFormFieldDescription["default"] can be undefined.
                        const configCopy = JSON.parse(
                            JSON.stringify(data.config),
                        ) as JSONSchemaObject;

                        function overrideDefaultsRec(
                            jsonSchemaObjectOrFormFieldDescription:
                                | JSONSchemaObject
                                | JSONSchemaFormFieldDescription,
                            path: string,
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
                                        overrideDefaultsRec(value, `${path}.${key}`),
                                );
                                return;
                            }

                            const jsonSchemaFormFieldDescription =
                                jsonSchemaObjectOrFormFieldDescription;

                            const assertWeHaveADefault = () => {
                                assert(
                                    jsonSchemaFormFieldDescription.default !== undefined,
                                    `${path} has no default value`,
                                );
                            };

                            const { overwriteDefaultWith } =
                                jsonSchemaFormFieldDescription["x-onyxia"] ?? {};

                            if (overwriteDefaultWith === undefined) {
                                assertWeHaveADefault();
                                return;
                            }

                            const resolvedValue = overwriteDefaultWith.includes("{{")
                                ? Mustache.render(overwriteDefaultWith, onyxiaValues)
                                : getValueAtPathInObject({
                                      "path": overwriteDefaultWith.split("."),
                                      "obj": onyxiaApiClient,
                                  });

                            if (resolvedValue === undefined || resolvedValue === null) {
                                assertWeHaveADefault();
                                return;
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
                                        `${overwriteDefaultWith} is not an array (${path})`,
                                    );
                                    jsonSchemaFormFieldDescription.default =
                                        resolvedValue;
                                    break;
                                case "object":
                                    assert(
                                        resolvedValue instanceof Object,
                                        `${overwriteDefaultWith} is not an object (${path})`,
                                    );
                                    jsonSchemaFormFieldDescription.default =
                                        resolvedValue;
                                    break;
                                case "boolean":
                                    assert(
                                        typeof resolvedValue !== "object",
                                        `${overwriteDefaultWith} can't be interpreted as a boolean (${path})`,
                                    );
                                    jsonSchemaFormFieldDescription.default =
                                        !!resolvedValue;
                                    break;
                                case "number":
                                case "integer":
                                    {
                                        const x = (() => {
                                            if (typeof resolvedValue === "number") {
                                                return resolvedValue;
                                            }

                                            const interpretedValue =
                                                typeof resolvedValue === "string"
                                                    ? parseFloat(resolvedValue)
                                                    : undefined;

                                            assert(
                                                interpretedValue !== undefined &&
                                                    !isNaN(interpretedValue),
                                                `${overwriteDefaultWith} can't be interpreted as a number (${path})`,
                                            );

                                            return interpretedValue;
                                        })();

                                        jsonSchemaFormFieldDescription.default = (() => {
                                            switch (jsonSchemaFormFieldDescription.type) {
                                                case "number":
                                                    return x;
                                                case "integer":
                                                    assert(
                                                        Number.isInteger(x),
                                                        `${overwriteDefaultWith} (${x}) is not an integer (${path})`,
                                                    );
                                                    return x;
                                            }
                                        })();
                                    }
                                    break;
                            }
                        }

                        overrideDefaultsRec(configCopy, "");

                        return configCopy;
                    },
                })),
        ...(() => {
            const getMyLab_App = (params: { serviceId: string }) =>
                axiosInstance.get("/my-lab/app", { params });

            const launchPackage = id<OnyxiaApiClient["launchPackage"]>(
                async ({ catalogId, packageName, options, isDryRun }) => {
                    const { serviceId } = getServiceId({
                        packageName,
                        "randomK8sSubdomain": getRandomK8sSubdomain(),
                    });

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
        "createAwsBucket": ({
            awsRegion,
            accessKey,
            secretKey,
            sessionToken,
            bucketName,
        }) =>
            axiosInstance
                .post<void>(
                    "/s3",
                    Object.entries({
                        awsRegion,
                        accessKey,
                        secretKey,
                        sessionToken,
                        bucketName,
                    })
                        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                        .join("&"),
                )
                .then(() => undefined),
    };

    return onyxiaApiClient;
}

let _s3url: string | undefined = undefined;

/** @deprecated: hack for legacy */
export function getS3Url() {
    assert(_s3url !== undefined);
    return _s3url;
}
