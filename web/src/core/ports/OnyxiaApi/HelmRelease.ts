export type HelmRelease = HelmRelease.Started | HelmRelease.Starting;

export declare namespace HelmRelease {
    export type Common = {
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
    };

    export type Started = Common & {
        isStarting: false;
    };

    export type Starting = Common & {
        isStarting: true;
        prStarted: Promise<{ isConfirmedJustStarted: boolean }>;
    };
}
