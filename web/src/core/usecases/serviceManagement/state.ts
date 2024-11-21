import { assert } from "tsafe/assert";
import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import type { HelmRelease } from "core/ports/OnyxiaApi/HelmRelease";

export type State = State.NotInitialized | State.Ready;

export namespace State {
    export type Common = {
        isUpdating: boolean;
        commandLogsEntries: {
            cmdId: number;
            cmd: string;
            resp: string | undefined;
        }[];
    };

    export type NotInitialized = Common & {
        stateDescription: "not initialized";
    };

    export type Ready = Common & {
        stateDescription: "ready";
        username: string;
        kubernetesNamespace: string;
        helmReleases: HelmRelease[];
        lockedHelmReleaseNames: string[];
        logoUrlByReleaseName: Record<string, string | undefined>;
    };
}

export const name = "serviceManagement";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotInitialized>({
            stateDescription: "not initialized",
            isUpdating: false,
            commandLogsEntries: []
        })
    ),
    reducers: (() => {
        const reducers = {
            updateStarted: state => {
                state.isUpdating = true;
            },
            updateCompleted: (
                state,
                {
                    payload
                }: {
                    payload: {
                        helmReleases: HelmRelease[];
                        kubernetesNamespace: string;
                        logoUrlByReleaseName: Record<string, string | undefined>;
                        username: string;
                    };
                }
            ) => {
                const {
                    helmReleases,
                    kubernetesNamespace,
                    logoUrlByReleaseName,
                    username
                } = payload;

                return id<State.Ready>({
                    stateDescription: "ready",
                    isUpdating: false,
                    helmReleases,
                    kubernetesNamespace,
                    commandLogsEntries: state.commandLogsEntries,
                    lockedHelmReleaseNames:
                        state.stateDescription === "ready"
                            ? state.lockedHelmReleaseNames
                            : [],
                    logoUrlByReleaseName,
                    username
                });
            },
            helmReleaseLocked: (
                state,
                {
                    payload
                }: {
                    payload: {
                        helmReleaseName: string;
                        reason: "delete" | "suspend" | "other";
                    };
                }
            ) => {
                const { helmReleaseName } = payload;

                assert(state.stateDescription === "ready");

                state.lockedHelmReleaseNames.push(helmReleaseName);
            },
            helmReleaseUnlocked: (
                state,
                { payload }: { payload: { helmReleaseName: string } }
            ) => {
                const { helmReleaseName } = payload;

                assert(state.stateDescription === "ready");

                state.lockedHelmReleaseNames = state.lockedHelmReleaseNames.filter(
                    lockedHelmReleaseName => lockedHelmReleaseName !== helmReleaseName
                );
            },
            changeServiceFriendlyNameStarted: (
                state,
                {
                    payload
                }: { payload: { helmReleaseName: string; friendlyName: string } }
            ) => {
                const { helmReleaseName, friendlyName } = payload;

                assert(state.stateDescription === "ready");

                reducers.helmReleaseLocked(state, {
                    payload: { helmReleaseName, reason: "other" }
                });

                const helmRelease = state.helmReleases.find(
                    helmRelease => helmRelease.helmReleaseName === helmReleaseName
                );

                assert(helmRelease !== undefined);

                helmRelease.friendlyName = friendlyName;
            },
            changeServiceFriendlyNameCompleted: (
                state,
                { payload }: { payload: { helmReleaseName: string } }
            ) => {
                const { helmReleaseName } = payload;

                reducers.helmReleaseUnlocked(state, { payload: { helmReleaseName } });
            },
            changeServiceSharedStatusStarted: (
                state,
                { payload }: { payload: { helmReleaseName: string; isShared: boolean } }
            ) => {
                const { helmReleaseName, isShared } = payload;

                assert(state.stateDescription === "ready");

                reducers.helmReleaseLocked(state, {
                    payload: { helmReleaseName, reason: "other" }
                });

                const helmRelease = state.helmReleases.find(
                    helmRelease => helmRelease.helmReleaseName === helmReleaseName
                );

                assert(helmRelease !== undefined);

                helmRelease.isShared = isShared;
            },
            changeServiceSharedStatusCompleted: (
                state,
                { payload }: { payload: { helmReleaseName: string } }
            ) => {
                const { helmReleaseName } = payload;

                reducers.helmReleaseUnlocked(state, { payload: { helmReleaseName } });
            },
            commandLogsEntryAdded: (
                state,
                {
                    payload
                }: {
                    payload: {
                        commandLogsEntry: {
                            cmdId: number;
                            cmd: string;
                            resp: string | undefined;
                        };
                    };
                }
            ) => {
                const { commandLogsEntry } = payload;

                state.commandLogsEntries.push(commandLogsEntry);
            },
            commandLogsRespUpdated: (
                state,
                {
                    payload
                }: {
                    payload: {
                        cmdId: number;
                        resp: string;
                    };
                }
            ) => {
                const { cmdId, resp } = payload;

                const commandLogsEntry = state.commandLogsEntries.find(
                    commandLogsEntry => commandLogsEntry.cmdId === cmdId
                );

                assert(commandLogsEntry !== undefined);

                commandLogsEntry.resp = resp;
            }
        } satisfies Record<string, (state: State, ...rest: any[]) => State | void>;

        return reducers;
    })()
});
