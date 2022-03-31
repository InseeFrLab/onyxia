import type { JSONSchemaObject } from "core/tools/JSONSchemaObject";
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

    // prettier-ignore
    getPackageConfigJSONSchemaObjectWithRenderedMustachParamsFactory: (
        params: {
            catalogId: string;
            packageName: string;
        }
    ) => Promise<{
        getPackageConfigJSONSchemaObjectWithRenderedMustachParams: (params: { mustacheParams: MustacheParams; }) => JSONSchemaObject;
        dependencies: { enabled: boolean; name: string; }[];
        sources: string[];
    }>;

    launchPackage: (params: {
        catalogId: string;
        packageName: string;
        options: Record<string, unknown>;
        isDryRun: boolean;
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

export const languages = ["en", "fr"] as const;
export type Language = typeof languages[number];

export type DeploymentRegion = {
    id: string;
    servicesMonitoringUrlPattern: string | undefined;
    defaultIpProtection: boolean | undefined;
    defaultNetworkPolicy: boolean | undefined;
    kubernetesClusterDomain: string;
    initScriptUrl: string;
    s3: DeploymentRegion.S3 | undefined;
};
export namespace DeploymentRegion {
    export type S3 = S3.Minio | S3.Amazon;
    export namespace S3 {
        export type Common = {
            defaultDurationSeconds?: number;
            monitoringUrlPattern?: string;
            keycloakParams?: {
                url?: string;
                realm?: string;
                clientId: string;
            };
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
    location: string;
    catalog: {
        packages: {
            description: string;
            icon?: string;
            name: string;
            home?: string;
        }[];
    };
};

export type MustacheParams = {
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
        token: string | null;
    };
    vault: {
        VAULT_ADDR: string;
        VAULT_TOKEN: string;
        VAULT_MOUNT: string;
        VAULT_TOP_DIR: string;
    };
    kaggleApiToken: string | null;
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
    };
    k8s: {
        domain: string;
        randomSubdomain: string;
        initScriptUrl: string;
    };
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

export const onyxiaFriendlyNameFormFieldPath = "onyxia.friendlyName";

export const onyxiaIsSharedFormFieldPath = "onyxia.share";

export const getRandomK8sSubdomain = memoize(
    () => `${Math.floor(Math.random() * 1000000)}`,
);

export function getServiceId(params: {
    packageName: string;
    randomK8sSubdomain: string;
}) {
    const { packageName, randomK8sSubdomain } = params;
    const serviceId = `${packageName}-${randomK8sSubdomain}`;
    return { serviceId };
}
