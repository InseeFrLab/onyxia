import type { OidcParams_Partial } from "./OidcParams";
import type { LocalizedString } from "./Language";

export type DeploymentRegion = {
    id: string;
    servicesMonitoringUrlPattern: string | undefined;
    defaultIpProtection: boolean | undefined;
    defaultNetworkPolicy: boolean | undefined;
    kubernetesClusterDomain: string;
    kubernetesClusterIngressPort: number | undefined;
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
    s3Configs: DeploymentRegion.S3Config[];
    s3ConfigCreationFormDefaults:
        | (Pick<DeploymentRegion.S3Config, "url" | "pathStyleAccess" | "region"> & {
              workingDirectory: DeploymentRegion.S3Config["workingDirectory"] | undefined;
          })
        | undefined;
    _s3Next: {
        s3Profiles: DeploymentRegion.S3Next.S3Profile[];
        s3Profiles_defaultValuesOfCreationForm:
            | Pick<
                  DeploymentRegion.S3Next.S3Profile,
                  "url" | "pathStyleAccess" | "region"
              >
            | undefined;
    };

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
              oidcParams: OidcParams_Partial;
          }
        | undefined;
    proxyInjection:
        | {
              enabled: boolean | undefined;
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
              usernamePrefix?: string;
              oidcParams: OidcParams_Partial;
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
    certManager: {
        useCertManager: boolean;
        certManagerClusterIssuer: string | undefined;
    };
    openshiftSCC:
        | {
              scc: string;
              enabled: boolean;
          }
        | undefined;
};
export namespace DeploymentRegion {
    /** https://github.com/InseeFrLab/onyxia-api/blob/main/docs/region-configuration.md#s3 */
    export type S3Config = {
        url: string;
        pathStyleAccess: boolean;
        region: string | undefined;
        sts: {
            url: string | undefined;
            durationSeconds: number | undefined;
            role:
                | {
                      roleARN: string;
                      roleSessionName: string;
                  }
                | undefined;
            oidcParams: OidcParams_Partial;
        };
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
        bookmarkedDirectories: S3Config.BookmarkedDirectory[];
    };

    export namespace S3Config {
        export type BookmarkedDirectory =
            | BookmarkedDirectory.Static
            | BookmarkedDirectory.Dynamic;

        export namespace BookmarkedDirectory {
            export type Common = {
                fullPath: string;
                title: LocalizedString;
                description: LocalizedString | undefined;
                tags: LocalizedString[] | undefined;
            };

            export type Static = Common & {
                claimName: undefined;
            };

            export type Dynamic = Common & {
                claimName: string;
                includedClaimPattern: string | undefined;
                excludedClaimPattern: string | undefined;
            };
        }
    }

    export namespace S3Next {
        /** https://github.com/InseeFrLab/onyxia-api/blob/main/docs/region-configuration.md#s3 */
        export type S3Profile = {
            url: string;
            pathStyleAccess: boolean;
            region: string | undefined;
            sts: {
                url: string | undefined;
                durationSeconds: number | undefined;
                role:
                    | {
                          roleARN: string;
                          roleSessionName: string;
                      }
                    | undefined;
                oidcParams: OidcParams_Partial;
            };
            bookmarks: S3Profile.Bookmark[];
        };

        export namespace S3Profile {
            export type Bookmark = {
                s3UriPrefix: string;
                title: LocalizedString;
                description: LocalizedString | undefined;
                tags: LocalizedString[];
            } & (
                | {
                      claimName: undefined;
                      includedClaimPattern?: never;
                      excludedClaimPattern?: never;
                  }
                | {
                      claimName: string;
                      includedClaimPattern: string | undefined;
                      excludedClaimPattern: string | undefined;
                  }
            );
        }
    }
}
