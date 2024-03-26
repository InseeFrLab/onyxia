import type { XOnyxiaContext } from "./XOnyxia";
import type { DeploymentRegion } from "./DeploymentRegion";
import type { Project } from "./Project";
import type { Catalog } from "./Catalog";
import type { Chart } from "./Chart";
import type { HelmRelease } from "./HelmRelease";
import type { User } from "./User";
import { JSONSchemaObject } from "./JSONSchema";
import type { NonPostableEvt } from "evt";

export type OnyxiaApi = {
    getAvailableRegionsAndOidcParams: {
        (): Promise<{
            regions: DeploymentRegion[];
            oidcParams:
                | {
                      issuerUri: string;
                      clientId: string;
                      serializedExtraQueryParams: string | undefined;
                  }
                | undefined;
        }>;
        clear: () => void;
    };

    getIp: () => Promise<string>;

    getUserAndProjects: {
        (): Promise<{ user: User; projects: Project[] }>;
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

    onboard: (params: { group: string | undefined }) => Promise<void>;

    getQuotas: () => Promise<Record<string, Record<"spec" | "usage", string | number>>>;

    getTaskLogs: (params: { helmReleaseName: string; taskId: string }) => Promise<string>;

    subscribeToClusterEvents: (params: {
        onNewEvent: (event: {
            message: string;
            timestamp: number;
            severity: "info" | "warning" | "error";
            originalEvent: Record<string, unknown>;
        }) => void;
        evtUnsubscribe: NonPostableEvt<void>;
    }) => Promise<void>;
};
