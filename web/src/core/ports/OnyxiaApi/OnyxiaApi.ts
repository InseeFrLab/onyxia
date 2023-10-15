import type { XOnyxiaContext } from "./XOnyxia";
import type { DeploymentRegion } from "./DeploymentRegion";
import type { Project } from "./Project";
import type { Catalog } from "./Catalog";
import type { Chart } from "./Chart";
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

    getCatalogsAndCharts: {
        (): Promise<{
            catalogs: Catalog[];
            chartsByCatalogId: Record<string, Chart[]>;
        }>;
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
