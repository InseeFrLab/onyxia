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
    s3Params: DeploymentRegion.S3 | undefined;
    doAllowS3ConfigurationByUser: boolean;
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
    export type S3 = {
        /**
         * The URL of the S3 server.
         * Examples: "https://minio.sspcloud.fr" or "https://s3.amazonaws.com".
         */
        url: string;

        pathStyleAccess: boolean;

        /**
         * The region for the S3 service. Optional for MinIO as it's not relevant.
         */
        region: string | undefined;

        /**
         * Configuration for obtaining temporary S3 credentials via OIDC.
         * Users can also provide their own credentials (access key and secret key)
         * via the user interface.
         */
        sts:
            | {
                  /**
                   * The duration for which the temporary credentials are valid.
                   * For AWS: maximum of 43200 seconds (12 hours).
                   * For MinIO: maximum of 604800 seconds (7 days).
                   */
                  durationSeconds: number | undefined;

                  /**
                   * Role configuration, mandatory for AWS but optional for MinIO.
                   * Example roleARN: "arn:aws:iam::123456789012:role/onyxia".
                   * Example roleSessionName: "onyxia".
                   */
                  role:
                      | {
                            roleARN: string;
                            roleSessionName: string;
                        }
                      | undefined;

                  /**
                   * OIDC configuration details. If not specified, the default Onyxia API authentication configuration is used.
                   * Specify only a clientID to use the same issuerURI as the Onyxia API authentication.
                   */
                  oidcParams:
                      | {
                            issuerUri?: string;
                            clientId: string;
                        }
                      | undefined;
              }
            | undefined;

        /**
         * Configuration for the working directory in the S3 storage.
         * There are two modes: single bucket and multi bucket.
         *
         * Single bucket mode:
         * All users and projects share the same bucket. Commonly used with AWS.
         * Example configuration for a user 'bob' in a project group 'exploration':
         *    "workingDirectory": {
         *        "bucketMode": "single",
         *        "bucketName": "onyxia",
         *        "prefix": "user-",
         *        "prefixGroup": "project-",
         *        "subPath": "",
         *        "subPathGroup": "foo/bar/"
         *    }
         * Personal project directory: onyxia/user-bob/
         * Group project directory: onyxia/project-exploration/foo/bar/
         *
         * Multi bucket mode:
         * Each user and project has its own bucket. Recommended for MinIO.
         * Example configuration for user 'bob' in the 'exploration' group:
         *    "workingDirectory": {
         *       "bucketMode": "multi",
         *       "bucketNamePrefix": "user-",
         *       "bucketNamePrefixGroup": "project-",
         *       "usbPath": "",
         *       "usbPathGroup": "foo/bar/"
         *    }
         * Personal project directory: user-bob/
         * Group project directory: project-exploration/foo/bar/
         */
        workingDirectory:
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
}
