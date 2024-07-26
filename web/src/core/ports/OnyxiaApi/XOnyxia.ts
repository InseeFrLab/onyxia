// Documentation: https://docs.onyxia.sh/contributing/catalog-of-services

import type { Language } from "./Language";
import { assert, type Equals } from "tsafe/assert";

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
     *
     */
    overwriteDefaultWith?:
        | string
        | number
        | boolean
        | unknown[]
        | Record<string, unknown>;
    hidden?: boolean;
    readonly?: boolean;
    useRegionSliderConfig?: string;
};

export type XOnyxiaContext = {
    user: {
        idep: string;
        name: string;
        email: string;
        password: string;
        ip: string;
        darkMode: boolean;
        lang: "en" | "fr" | "zh-CN" | "no" | "fi" | "nl" | "it" | "de";
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
    vault: {
        VAULT_ADDR: string;
        VAULT_TOKEN: string;
        VAULT_MOUNT: string;
        VAULT_TOP_DIR: string;
    };
    s3: {
        AWS_ACCESS_KEY_ID: string;
        AWS_SECRET_ACCESS_KEY: string;
        AWS_SESSION_TOKEN: string;
        AWS_DEFAULT_REGION: string;
        AWS_S3_ENDPOINT: string;
        AWS_BUCKET_NAME: string;
        port: number;
        pathStyleAccess: boolean;
        /**
         * The user is assumed to have read/write access on every
         * object starting with this prefix on the bucket
         **/
        objectNamePrefix: string;
        /**
         * Only for making it easier for charts editors.
         * <AWS_BUCKET_NAME>/<objectNamePrefix>
         * */
        workingDirectoryPath: string;
    };
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
