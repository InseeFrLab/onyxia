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
    s3Profiles: DeploymentRegion.S3Profile[];
    s3Profiles_defaultValuesOfCreationForm:
        | Pick<DeploymentRegion.S3Profile, "url" | "pathStyleAccess" | "region">
        | undefined;

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
    export type S3Profile = {
        profileName: string | undefined;
        url: string;
        pathStyleAccess: boolean;
        region: string | undefined;
        sts: {
            url: string | undefined;
            durationSeconds: number | undefined;
            roles: S3Profile.StsRole[];
            oidcParams: OidcParams_Partial;
        };
        bookmarks: S3Profile.Bookmark[];
    };

    export namespace S3Profile {
        export type StsRole = {
            roleARN: string;
            roleSessionName: string;
            profileName: string;
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

        export type Bookmark = {
            s3UriPrefix: string;
            title: LocalizedString;
            description: LocalizedString | undefined;
            tags: LocalizedString[];
            forProfileNames: string[];
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
