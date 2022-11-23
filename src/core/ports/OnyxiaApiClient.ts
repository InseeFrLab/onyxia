import type { LocalizedString as GenericLocalizedString } from "i18nifty";
import memoize from "memoizee";

export type OnyxiaApiClient = {
    /**
     * This is basically a function that is expected that return
     * a promise of string. It's called like this:
     * const ip = await onyxiaApiClient.getIp();
     * The fact that it also have clear() means that we expect the result
     * to be memoized meaning unless onyxiaApiCLient.getIp.clear() is called
     * the cached result will be returned on subsequent calls.
     * We use memoized function for fetched values that are unlikely to change
     * in the lifespan of a run of the app.
     */
    getAvailableRegions: {
        (): Promise<DeploymentRegion[]>;
        clear: () => void;
    };

    getIp: {
        (): Promise<string>;
        clear: () => void;
    };

    getUserProjects: {
        (): Promise<Project[]>;
        clear: () => void;
    };

    getCatalogs: {
        (): Promise<Catalog[]>;
        clear: () => void;
    };

    getPackageConfig: (params: { catalogId: string; packageName: string }) => Promise<{
        getValuesSchemaJson: (params: { onyxiaValues: OnyxiaValues }) => JSONSchemaObject;
        dependencies: string[];
        sources: string[];
    }>;

    launchPackage: (params: {
        catalogId: string;
        packageName: string;
        options: Record<string, unknown>;
        isDryRun: boolean;
        name: string | undefined;
    }) => Promise<{ contract: Contract }>;

    getRunningServices: () => Promise<RunningService[]>;

    stopService: (params: { serviceId: string }) => Promise<void>;

    createAwsBucket: (params: {
        awsRegion: string;
        accessKey: string;
        secretKey: string;
        sessionToken: string;
        bucketName: string;
    }) => Promise<void>;
};

export type Language = "en" | "fr" | "zh-CN";
export type LocalizedString = GenericLocalizedString<Language>;

export type DeploymentRegion = {
    id: string;
    servicesMonitoringUrlPattern: string | undefined;
    defaultIpProtection: boolean | undefined;
    defaultNetworkPolicy: boolean | undefined;
    kubernetesClusterDomain: string;
    ingressClassName: string | undefined;
    initScriptUrl: string;
    s3: DeploymentRegion.S3 | undefined;
    allowedURIPatternForUserDefinedInitScript: string;
    kafka:
        | {
              url: string;
              topicName: string;
          }
        | undefined;
    tolerations: unknown[] | undefined;
    from: unknown[] | undefined;
    nodeSelector: Record<string, unknown> | undefined;
    startupProbe: Record<string, unknown> | undefined;
    vault:
        | {
              url: string;
              kvEngine: string;
              role: string;
              keycloakParams:
                  | {
                        url: string | undefined;
                        realm: string | undefined;
                        clientId: string;
                    }
                  | undefined;
          }
        | undefined;
    proxyInjection:
        | {
              httpProxyUrl: string | undefined;
              httpsProxyUrl: string | undefined;
              noProxy: string | undefined;
          }
        | undefined;
    packageRepositoryInjection:
        | {
              cranProxyUrl: string | undefined;
              condaProxyUrl: string | undefined;
              pypiProxyUrl: string | undefined;
          }
        | undefined;
    certificateAuthorityInjection: { crts: unknown[] | undefined } | undefined;
};
export namespace DeploymentRegion {
    export type S3 = S3.Minio | S3.Amazon;
    export namespace S3 {
        export type Common = {
            defaultDurationSeconds: number | undefined;
            monitoringUrlPattern: string | undefined;
            keycloakParams:
                | {
                      url: string | undefined;
                      realm: string | undefined;
                      clientId: string;
                  }
                | undefined;
        };

        export type Minio = Common & {
            type: "minio";
            url: string; //"https://minio.sspcloud.fr",
            region: string | undefined; // default "us-east-1"
        };

        export type Amazon = Common & {
            type: "amazon";
            region: string; //"us-east-1"
            roleARN: string; //"arn:aws:iam::873875581780:role/test";
            roleSessionName: string; //"onyxia";
        };
    }
}

export type Project = {
    id: string;
    name: string;
    bucket: string;
    namespace: string;
    vaultTopDir: string;
};

export type Catalog = {
    id: string;
    name: LocalizedString;
    location: string;
    description: LocalizedString;
    status: "PROD" | "TEST";
    charts: Catalog.Chart[];
    highlightedCharts?: string[];
};

export namespace Catalog {
    export type Chart = {
        name: string;
        versions: {
            description: string;
            version: string;
            icon: string | undefined;
            home: string | undefined;
        }[];
    };
}

export type OnyxiaValues = {
    user: {
        idep: string;
        name: string;
        email: string;
        password: string;
        ip: string;
    };
    project: {
        id: string;
        password: string;
        basic: string;
    };
    git: {
        name: string;
        email: string;
        credentials_cache_duration: number;
        token: string | undefined;
    };
    vault: {
        VAULT_ADDR: string;
        VAULT_TOKEN: string;
        VAULT_MOUNT: string;
        VAULT_TOP_DIR: string;
    };
    kaggleApiToken: string | undefined;
    s3: {
        AWS_ACCESS_KEY_ID: string;
        AWS_SECRET_ACCESS_KEY: string;
        AWS_SESSION_TOKEN: string;
        AWS_DEFAULT_REGION: string;
        AWS_S3_ENDPOINT: string;
        AWS_BUCKET_NAME: string;
        port: number;
    };
    region: {
        defaultIpProtection: boolean | undefined;
        defaultNetworkPolicy: boolean | undefined;
        allowedURIPattern: string;
        kafka:
            | {
                  url: string;
                  topicName: string;
              }
            | undefined;
        tolerations: unknown[] | undefined;
        from: unknown[] | undefined;
        nodeSelector: Record<string, unknown> | undefined;
        startupProbe: Record<string, unknown> | undefined;
    };
    k8s: {
        domain: string;
        ingressClassName: string | undefined;
        randomSubdomain: string;
        initScriptUrl: string;
    };
    proxyInjection:
        | {
              httpProxyUrl: string | undefined;
              httpsProxyUrl: string | undefined;
              noProxy: string | undefined;
          }
        | undefined;
    packageRepositoryInjection:
        | {
              cranProxyUrl: string | undefined;
              condaProxyUrl: string | undefined;
              pypiProxyUrl: string | undefined;
          }
        | undefined;
    certificateAuthorityInjection:
        | {
              crts: unknown[] | undefined;
          }
        | undefined;
};

export type RunningService = RunningService.Started | RunningService.Starting;
export declare namespace RunningService {
    export type Common = {
        id: string;
        packageName: string;
        friendlyName: string;
        urls: string[];
        startedAt: number;
        postInstallInstructions: string | undefined;
        isShared: boolean;
        env: Record<string, string>;
        ownerUsername: string;
    };

    export type Started = Common & {
        isStarting: false;
    };

    export type Starting = Common & {
        isStarting: true;
        prStarted: Promise<{ isConfirmedJustStarted: boolean }>;
    };
}

export type Contract = Record<string, unknown>[][];

export type JSONSchemaObject = {
    description?: string;
    properties: Record<string, JSONSchemaObject | JSONSchemaFormFieldDescription>;
    type: "object";
};

export type JSONSchemaFormFieldDescription =
    | JSONSchemaFormFieldDescription.String
    | JSONSchemaFormFieldDescription.Boolean
    | JSONSchemaFormFieldDescription.Integer
    | JSONSchemaFormFieldDescription.Object
    | JSONSchemaFormFieldDescription.Array;
export namespace JSONSchemaFormFieldDescription {
    type Common<T> = {
        description?: string;
        title?: string;
        //NOTE: Can be undefined before we inject the onyxia values.
        default: T;
        "x-onyxia"?: {
            hidden?: boolean;
            readonly?: boolean;
            overwriteDefaultWith?: string;
        };
        hidden?:
            | boolean
            | {
                  value: string | boolean | number;
                  path: string;
              };
    };

    export type Boolean = Common<boolean> & {
        type: "boolean";
    };

    export type Integer = Common<number> & {
        type: "integer" | "number";
        minimum?: number;
    };

    export type String = String.Text | String.Enum | String.Slider;
    export namespace String {
        export type Text = Common<string> & {
            type: "string";
            pattern?: string;
            render?: "textArea" | "password";
            //NOTE: Only for init.personalInit
            "x-security"?: {
                pattern: string;
            };
        };

        export type Enum<T extends string = string> = Common<T> & {
            type: "string";
            enum: T[];
        };

        export type Slider = Slider.Simple | Slider.Range;
        export namespace Slider {
            type SliderCommon<Unit extends string> = Common<`${number}${Unit}`> & {
                type: "string";
                render: "slider";
            };

            export type Simple<Unit extends string = string> = SliderCommon<Unit> & {
                sliderMax: number;
                sliderMin: number;
                sliderUnit: Unit;
                sliderStep: number;
            };

            export type Range = Range.Down | Range.Up;
            export namespace Range {
                type RangeCommon<Unit extends string> = SliderCommon<Unit> & {
                    sliderExtremitySemantic: string;
                    sliderRangeId: string;
                };

                export type Down<Unit extends string = string> = RangeCommon<Unit> & {
                    sliderExtremity: "down";
                    sliderMin: number;
                    sliderUnit: Unit;
                    sliderStep: number;
                    title: string;
                };

                export type Up<Unit extends string = string> = RangeCommon<Unit> & {
                    sliderExtremity: "up";
                    sliderMax: number;
                };
            }
        }
    }

    export type Object = Common<Record<string, any>> & {
        type: "object";
    };

    export type Array = Common<any[]> & {
        type: "array";
    };
}

export const onyxiaFriendlyNameFormFieldPath = "onyxia.friendlyName";

export const onyxiaIsSharedFormFieldPath = "onyxia.share";

export const getRandomK8sSubdomain = memoize(
    () => `${Math.floor(Math.random() * 1000000)}`
);

export function getServiceId(params: {
    packageName: string;
    randomK8sSubdomain: string;
}) {
    const { packageName, randomK8sSubdomain } = params;
    const serviceId = `${packageName}-${randomK8sSubdomain}`;
    return { serviceId };
}
