import type { DeploymentRegion } from "./DeploymentRegion";
import type { Project } from "./Project";
import type { Catalog } from "./Catalog";
import type { Chart } from "./Chart";
import type { HelmRelease } from "./HelmRelease";
import type { User } from "./User";
import { JSONSchema } from "./JSONSchema";
import type { NonPostableEvt } from "evt";
import type { Stringifyable } from "core/tools/Stringifyable";
import type { OidcParams } from "./OidcParams";

export type OnyxiaApi = {
    getAvailableRegionsAndOidcParams: () => Promise<{
        regions: DeploymentRegion[];
        oidcParams: OidcParams | undefined;
    }>;

    getIp: () => Promise<string>;

    getUserAndProjects: () => Promise<{ user: User; projects: Project[] }>;

    getCatalogsAndCharts: () => Promise<{
        catalogs: Catalog[];
        chartsByCatalogId: Record<string, Chart[]>;
    }>;

    getChartAvailableVersions: (params: {
        catalogId: string;
        chartName: string;
    }) => Promise<string[]>;

    getHelmChartDetails: (params: {
        catalogId: string;
        chartName: string;
        chartVersion: string;
    }) => Promise<{
        helmValuesSchema: JSONSchema | undefined;
        helmValuesYaml: string;
        helmChartSourceUrls: string[];
        helmDependencies: {
            helmRepositoryUrl: string;
            chartName: string;
            chartVersion: string;
            condition: (string | number)[] | undefined;
        }[];
    }>;

    helmInstall: (params: {
        helmReleaseName: string;
        catalogId: string;
        chartName: string;
        chartVersion: string;
        friendlyName: string;
        isShared: boolean | undefined;
        values: Record<string, Stringifyable>;
    }) => Promise<void>;

    listHelmReleases: () => Promise<HelmRelease[]>;

    changeHelmReleaseFriendlyName: (params: {
        helmReleaseName: string;
        friendlyName: string;
    }) => Promise<void>;

    changeHelmReleaseSharedStatus: (params: {
        helmReleaseName: string;
        isShared: boolean;
    }) => Promise<void>;

    helmUninstall: (params: { helmReleaseName: string }) => Promise<void>;
    helmUpgradeGlobalSuspend: (params: {
        helmReleaseName: string;
        value: boolean;
    }) => Promise<void>;

    onboard: (params: { group: string | undefined }) => Promise<void>;

    getQuotas: () => Promise<Record<string, Record<"spec" | "usage", string | number>>>;

    kubectlLogs: (params: {
        helmReleaseName: string;
        podName: string;
    }) => Promise<string>;

    subscribeToClusterEvents: (params: {
        onNewEvent: (event: {
            eventId: string;
            message: string;
            timestamp: number;
            severity: "info" | "warning" | "error";
            originalEvent: Record<string, unknown>;
        }) => void;
        evtUnsubscribe: NonPostableEvt<void>;
    }) => Promise<void>;
};
