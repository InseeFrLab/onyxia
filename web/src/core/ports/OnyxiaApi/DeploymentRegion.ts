export type DeploymentRegion = {
    id: string;
    servicesMonitoringUrlPattern: string | undefined;
    defaultIpProtection: boolean | undefined;
    defaultNetworkPolicy: boolean | undefined;
    kubernetesClusterDomain: string;
    ingressClassName: string | undefined;
    ingress: boolean | undefined;
    route: boolean | undefined;
    istio:
        | {
              enabled: boolean;
              gateways: string[];
          }
        | undefined;
    initScriptUrl: string;
    s3Params: DeploymentRegion.S3Params;
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
              authPath: string | undefined;
              oidcParams:
                  | {
                        issuerUri?: string;
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
              packageManagerUrl: string | undefined;
              pypiProxyUrl: string | undefined;
          }
        | undefined;
    certificateAuthorityInjection:
        | {
              cacerts: string | undefined;
              pathToCaBundle: string | undefined;
          }
        | undefined;
    kubernetes:
        | {
              url: string;
              oidcParams:
                  | {
                        issuerUri?: string;
                        clientId: string;
                    }
                  | undefined;
          }
        | undefined;
    sliders: Record<
        string,
        {
            sliderMin: number;
            sliderMax: number;
            sliderStep: number;
            sliderUnit: string;
        }
    >;
    resources:
        | {
              cpuRequest?: `${number}${string}`;
              cpuLimit?: `${number}${string}`;
              memoryRequest?: `${number}${string}`;
              memoryLimit?: `${number}${string}`;
              disk?: `${number}${string}`;
              gpu?: `${number}`;
          }
        | undefined;
};
export namespace DeploymentRegion {
    export type S3Params = {
        serverIntegratedWithOidc: S3Params.ServerIntegratedWithOidc | undefined;
        doAllowConnectionToOtherS3Servers:
            | boolean
            | {
                  defaultUrl: string;
                  defaultRegion: string;
              };
    };

    export namespace S3Params {
        export type ServerIntegratedWithOidc =
            | ServerIntegratedWithOidc.OnPremise
            | ServerIntegratedWithOidc.CloudProvider;

        export namespace ServerIntegratedWithOidc {
            type Common = {
                oidcParams:
                    | {
                          issuerUri?: string;
                          clientId: string;
                      }
                    | undefined;
                requestedTokenValidityDurationSeconds: number | undefined;
                doSupportDynamicBucketCreation: boolean;
                region: string | undefined;
                roleARN: string | undefined;
                roleSessionName: string | undefined;
            };

            export type OnPremise = Common & {
                isOnPremise: true;
                url: string;
            };

            export type CloudProvider = CloudProvider.AmazonWebServices;

            export namespace CloudProvider {
                type CloudProviderCommon = Common & {
                    isOnPremise: false;
                    cloudProvider: "Amazon web services";
                };

                export type AmazonWebServices = CloudProviderCommon & {
                    region: string;
                    roleARN: string;
                    roleSessionName: string;
                };
            }
        }
    }
}
