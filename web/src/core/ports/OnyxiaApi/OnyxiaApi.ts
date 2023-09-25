import type { XOnyxiaContext } from "./XOnyxia";
import type { DeploymentRegion } from "./DeploymentRegion";
import type { Project } from "./Project";
import type { Catalog } from "./Catalog";
import type { RunningService } from "./RunningService";
import type { User } from "./User";
import { JSONSchemaObject } from "./JSONSchema";

export type OnyxiaApi = {
    /**
     * This is basically a function that is expected that return
     * a promise of string. It's called like this:
     * const ip = await onyxiaApi.getIp();
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

    getPackageConfig: (params: { catalogId: string; packageName: string }) => Promise<{
        getValuesSchemaJson: (params: {
            xOnyxiaContext: XOnyxiaContext;
        }) => JSONSchemaObject;
        dependencies: string[];
        sources: string[];
    }>;

    launchPackage: (params: {
        catalogId: string;
        packageName: string;
        options: Record<string, unknown>;
    }) => Promise<void>;

    getRunningServices: () => Promise<RunningService[]>;

    stopService: (params: { serviceId: string }) => Promise<void>;

    createAwsBucket: (params: {
        awsRegion: string;
        accessKey: string;
        secretKey: string;
        sessionToken: string;
        bucketName: string;
    }) => Promise<void>;

    onboard: () => Promise<void>;

    getUser: () => Promise<User>;
};
