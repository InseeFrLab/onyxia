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
    s3Params: DeploymentRegion.S3;
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
         * Enables users to override the default S3 configuration. When overridden,
         * users must provide their own credentials (access key and secret key).
         * This allows specifying a custom S3 server and a working directory on a per-project basis.
         */
        allowUserOverride: boolean;

        /**
         * The URL of the S3 server.
         * Examples: "https://minio.sspcloud.fr" or "https://s3.amazonaws.com".
         */
        url: string;

        /**
         * Specifies how the bucket name is included in the URL.
         * - For MinIO, a typical URL looks like: https://minio.sspcloud.fr/<bucket-name>/path/to/file.parquet
         *   In this case, set this property to "path".
         * - For other S3 implementations (like AWS), a typical URL is: https://<bucket-name>.s3.amazonaws.com/path/to/file.parquet
         *   Here, set this property to "subdomain".
         */
        bucketNameSpecifiedInUrlAs: "subdomain" | "path";

        /**
         * The region for the S3 service. Optional for MinIO as it's not relevant.
         * Defaults to "us-east-1" if not provided.
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
         *        "type": "single bucket",
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
         *       "type": "multi bucket",
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
                  type: "single bucket";
                  bucketName: string;
                  prefix: string;
                  prefixGroup: string;
                  subPath: string;
                  subPathGroup: string;
              }
            | {
                  type: "multi bucket";
                  bucketNamePrefix: string;
                  bucketNamePrefixGroup: string;
                  usbPath: string;
                  usbPathGroup: string;
              };
    };
}
