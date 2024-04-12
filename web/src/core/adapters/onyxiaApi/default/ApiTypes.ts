/* eslint-disable no-template-curly-in-string */
import type {
    LocalizedString,
    JSONSchemaObject,
    onyxiaFriendlyNameFormFieldPath,
    onyxiaIsSharedFormFieldPath
} from "core/ports/OnyxiaApi";

export type ApiTypes = {
    "/public/ip": {
        ip: string;
    };
    "/public/configuration": {
        build: {
            version: string;
        };
        regions: {
            id: string;
            services: {
                allowedURIPattern: string;
                customValues?: Record<string, unknown>;
                expose: {
                    domain: string;
                    ingressClassName: string;
                    ingress?: boolean;
                    route?: boolean;
                    istio?: {
                        enabled: boolean;
                        gateways: string[];
                    };
                    certManager?: {
                        useCertManager: boolean;
                        certManagerClusterIssuer?: string;
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
                    URL: string;
                    pathStyleAccess?: true;

                    region?: string;
                    sts?: {
                        URL?: string;
                        durationSeconds?: number;
                        role:
                            | {
                                  roleARN: string;
                                  roleSessionName: string;
                              }
                            | undefined;
                        oidcConfiguration?: {
                            issuerURI?: string;
                            clientID: string;
                        };
                    };

                    /** Ok to be undefined only if sts is undefined */
                    workingDirectory?:
                        | {
                              bucketMode: "shared";
                              bucketName: string;
                              prefix: string;
                              prefixGroup: string;
                          }
                        | {
                              bucketMode: "multi";
                              bucketNamePrefix: string;
                              bucketNamePrefixGroup: string;
                          };
                };
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
            extraQueryParams?: string;
        };
    };
    "/public/catalogs": {
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
                        icon?: string;
                        home?: string;
                    }[]
                >;
            };
            highlightedCharts?: string[];
        }[];
    };
    "/public/catalogs/${catalogId}/charts/${chartName}/versions/${chartVersion}": {
        config: JSONSchemaObject;
        sources?: string[];
        dependencies?: {
            name: string;
            repository: string;
            version: string;
        }[];
    };
    "/my-lab/services": {
        apps: {
            id: string;
            status: "deployed" | "pending-install" | "failed";
            urls: string[];
            env: {
                [onyxiaIsSharedFormFieldPath]: "true" | "false";
                [onyxiaFriendlyNameFormFieldPath]: string;
                "onyxia.owner": string;
                [key: string]: string;
            };
            startedAt: number;
            tasks: {
                id: string;
                containers: { ready: boolean }[];
            }[];
            postInstallInstructions?: string;
            chart: string;
            appVersion: string;
            revision: string;
            pausable: boolean;
            paused: boolean;
        }[];
    };
    "/user/info": {
        email: string;
        idep: string;
        nomComplet: string;
        projects: {
            id: string;
            name: string;
            group?: string;
            bucket: string;
            namespace: string;
            vaultTopDir: string;
        }[];
    };
    "/my-lab/quota": {
        spec: Record<string, number | string>;
        usage: Record<string, number | string>;
    };
    "/my-lab/events": {
        apiVersion: string;
        kind: string;
        metadata: {
            creationTimestamp: string;
            managedFields: {
                apiVersion: string;
                fieldsType: string;
                fieldsV1: {
                    [key: string]: Record<string, unknown>;
                };
                manager: string;
                operation: string;
                time: string;
            }[];
            name: string;
            namespace: string;
            resourceVersion: string;
            uid: string;
        };
        count: number;
        firstTimestamp: string;
        lastTimestamp: string;
        involvedObject: {
            apiVersion: string;
            kind: string;
            name: string;
            namespace: string;
            resourceVersion: string;
            uid: string;
        };
        message: string;
        reason: string;
        reportingComponent: string;
        reportingInstance: string;
        source: {
            component: string;
        };
        type: "Normal" | "Warning" | string; // Allows specific types but also remains open for extension.
    };
};
