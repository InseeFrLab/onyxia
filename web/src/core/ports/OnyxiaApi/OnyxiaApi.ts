import type { XOnyxiaContext } from "./XOnyxia";
import type { DeploymentRegion } from "./DeploymentRegion";
import type { Project } from "./Project";
import type { Catalog } from "./Catalog";
import type { RunningService } from "./RunningService";
import type { User } from "./User";
import { JSONSchemaObject } from "./JSONSchema";

export type OnyxiaApi = {
    getAvailableRegionsAndOidcParams: {
        (): Promise<{
            regions: DeploymentRegion[];
            oidcParams:
                | {
                      authority: string;
                      clientId: string;
                  }
                | undefined;
        }>;
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

    getPackageConfig: (params: {
        catalogId: string;
        packageName: string;
        isDevModeEnabled: boolean;
    }) => Promise<{
        getValuesSchemaJson: (params: {
            xOnyxiaContext: XOnyxiaContext;
        }) => JSONSchemaObject;
        dependencies: string[];
        sources: string[];
        packageVersion: string;
    }>;

    launchPackage: (params: {
        catalogId: string;
        packageName: string;
        packageVersion: string;
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
