import type { JSONSchemaObject } from "lib/tools/JSONSchemaObject";

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
};

export type DeploymentRegion = {
    id: string;
    servicesMonitoringUrlPattern: string | undefined;
    s3MonitoringUrlPattern: string | undefined;
    namespacePrefix: string;
    defaultIpProtection: boolean | undefined;
    defaultNetworkPolicy: boolean | undefined;
};

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
        AWS_DEFAULT_REGION: "us-east-1";
        AWS_S3_ENDPOINT: string;
        AWS_BUCKET_NAME: string;
        port: number;
    };
    region: {
        defaultIpProtection: boolean | undefined;
        defaultNetworkPolicy: boolean | undefined;
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
        owner: string;
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
