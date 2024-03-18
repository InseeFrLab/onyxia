export type HelmRelease = {
    helmReleaseName: string;
    friendlyName: string | undefined;
    urls: string[];
    startedAt: number;
    postInstallInstructions: string | undefined;
    isShared: boolean;
    env: Record<string, string>;
    ownerUsername: string;
    appVersion: string;
    revision: string;
    chartName: string;
    chartVersion: string;
    areAllTasksReady: boolean;
    status: "deployed" | "pending" | "failed";
    taskIds: string[];
};
