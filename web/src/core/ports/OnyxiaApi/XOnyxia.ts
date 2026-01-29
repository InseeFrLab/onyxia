// Documentation: https://docs.onyxia.sh/contributing/catalog-of-services

import type { Language } from "./Language";
import { id } from "tsafe/id";
import { z } from "zod";
import { assert, type Equals } from "tsafe/assert";
import { type Stringifyable, zStringifyable } from "core/tools/Stringifyable";

export const onyxiaReservedPropertyNameInFieldDescription = "x-onyxia";

export type XOnyxiaParams = {
    /**
     * This is where you can reference values from the onyxia context so that they
     * are dynamically injected by the Onyxia launcher.
     *
     * Examples:
     * "overwriteDefaultWith": "user.email" ( You can also write "{{user.email}}" it's equivalent )
     * "overwriteDefaultWith": "{{project.id}}-{{k8s.randomSubdomain}}.{{k8s.domain}}"
     * "overwriteDefaultWith": [ "a hardcoded value", "some other hardcoded value", "{{region.oauth2.clientId}}" ]
     * "overwriteDefaultWith": { "foo": "bar", "bar": "{{region.oauth2.clientId}}" }
     */
    overwriteDefaultWith?: string | Stringifyable[] | Record<string, Stringifyable>;
    overwriteListEnumWith?: string | Stringifyable[];
    hidden?: boolean;
    readonly?: boolean;
};

export const zXOnyxiaParams = (() => {
    type TargetType = XOnyxiaParams;

    const zTargetType = z.object({
        overwriteDefaultWith: z
            .union([z.string(), z.array(zStringifyable), z.record(zStringifyable)])
            .optional(),
        overwriteListEnumWith: z.union([z.string(), z.array(zStringifyable)]).optional(),
        hidden: z.boolean().optional(),
        readonly: z.boolean().optional()
    });

    assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export type XOnyxiaContext = {
    user: {
        idep: string;
        name: string;
        email: string;
        password: string;
        ip: string;
        darkMode: boolean;
        lang: "en" | "fr" | "zh-CN" | "no" | "fi" | "nl" | "it" | "es" | "de";
        /**
         * Decoded JWT OIDC ID token of the user launching the service.
         *
         * Sample value:
         * {
         *   "sub": "9000ffa3-5fb8-45b5-88e4-e2e869ba3cfa",
         *   "name": "Joseph Garrone",
         *   "aud": ["onyxia", "minio-datanode"],
         *   "groups": [
         *       "USER_ONYXIA",
         *       "codegouv",
         *       "onyxia",
         *       "sspcloud-admin",
         *   ],
         *   "preferred_username": "jgarrone",
         *   "given_name": "Joseph",
         *   "locale": "en",
         *   "family_name": "Garrone",
         *   "email": "joseph.garrone@insee.fr",
         *   "policy": "stsonly",
         *   "typ": "ID",
         *   "azp": "onyxia",
         *   "email_verified": true,
         *   "realm_access": {
         *       "roles": ["offline_access", "uma_authorization", "default-roles-sspcloud"]
         *   }
         * }
         */
        decodedIdToken: Record<string, unknown>;
        accessToken: string;
        refreshToken: string;
        // See: https://docs.onyxia.sh/v/v10/admin-doc/catalog-of-services/customize-your-charts/declarative-user-profile
        profile: Record<string, Stringifyable> | undefined;
    };
    service: {
        oneTimePassword: string;
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
    vault:
        | {
              VAULT_ADDR: string;
              VAULT_TOKEN: string | undefined;
              VAULT_MOUNT: string;
              VAULT_TOP_DIR: string;
          }
        | undefined;
    s3:
        | {
              isEnabled: true;
              AWS_ACCESS_KEY_ID: string | undefined;
              AWS_SECRET_ACCESS_KEY: string | undefined;
              AWS_SESSION_TOKEN: string | undefined;
              AWS_DEFAULT_REGION: string;
              AWS_S3_ENDPOINT: string;
              port: number;
              pathStyleAccess: boolean;
              /**
               * If true the bucket's (directory) should be accessible without any credentials.
               * In this case s3.AWS_ACCESS_KEY_ID, s3.AWS_SECRET_ACCESS_KEY and s3.AWS_SESSION_TOKEN
               * will be empty strings.
               */
              isAnonymous: boolean;
          }
        | undefined;
    region: {
        defaultIpProtection: boolean | undefined;
        defaultNetworkPolicy: boolean | undefined;
        allowedURIPattern: string;
        customValues: Record<string, unknown> | undefined;
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
        openshiftSCC:
            | {
                  scc: string;
                  enabled: boolean;
              }
            | undefined;
    };
    k8s: {
        domain: string;
        ingressClassName: string | undefined;
        ingress: boolean | undefined;
        route: boolean | undefined;
        istio:
            | {
                  enabled: boolean;
                  gateways: string[];
              }
            | undefined;
        randomSubdomain: string;
        initScriptUrl: string;
        useCertManager: boolean;
        certManagerClusterIssuer: string | undefined;
    };
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
};

assert<Equals<XOnyxiaContext["user"]["lang"], Language>>();
