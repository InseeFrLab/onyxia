export type DeploymentRegion = {
    id: string;
    servicesMonitoringUrlPattern: string | undefined;
    defaultIpProtection: boolean | undefined;
    defaultNetworkPolicy: boolean | undefined;
    kubernetesClusterDomain: string;
    ingressClassName: string | undefined;
    ingress: boolean | undefined;
    route: boolean | undefined;
    customValues: Record<string, unknown> | undefined;
    istio:
        | {
              enabled: boolean;
              gateways: string[];
          }
        | undefined;
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
    export type S3 = S3.Minio | S3.Amazon;
    export namespace S3 {
        export type Common = {
            defaultDurationSeconds: number | undefined;
            monitoringUrlPattern: string | undefined;
            oidcParams:
                | {
                      issuerUri?: string;
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
