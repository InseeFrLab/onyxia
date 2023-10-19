export type RunningService = RunningService.Started | RunningService.Starting;

export declare namespace RunningService {
    export type Common = {
        releaseName: string;
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
        version: string;
    };

    export type Started = Common & {
        isStarting: false;
    };

    export type Starting = Common & {
        isStarting: true;
        prStarted: Promise<{ isConfirmedJustStarted: boolean }>;
    };
}
