import type { XOnyxiaContext } from "./XOnyxia";
import type { DeploymentRegion } from "./DeploymentRegion";
import type { Project } from "./Project";
import type { Catalog } from "./Catalog";
import type { Chart } from "./Chart";
import type { HelmRelease } from "./HelmRelease";
import type { User } from "./User";
import { JSONSchemaObject } from "./JSONSchema";

export type OnyxiaApi = {
    getAvailableRegionsAndOidcParams: {
        (): Promise<{
            regions: DeploymentRegion[];
            oidcParams:
                | {
                      issuerUri: string;
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

    getHelmChartDetails: (params: {
        catalogId: string;
        chartName: string;
        chartVersion: string;
    }) => Promise<{
        getChartValuesSchemaJson: (params: {
            xOnyxiaContext: XOnyxiaContext;
        }) => JSONSchemaObject;
        nonLibraryDependencies: string[];
        sourceUrls: string[];
    }>;

    helmInstall: (params: {
        helmReleaseName: string;
        catalogId: string;
        chartName: string;
        chartVersion: string;
        values: Record<string, unknown>;
    }) => Promise<void>;

    listHelmReleases: () => Promise<HelmRelease[]>;

    helmUninstall: (params: { helmReleaseName: string }) => Promise<void>;

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
