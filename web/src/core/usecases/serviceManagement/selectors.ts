import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name, type RunningService } from "./state";

const state = (rootState: RootState) => rootState[name];

const readyState = createSelector(state, state => {
    if (state.stateDescription !== "ready") {
        return undefined;
    }

    return state;
});

const runningServices = createSelector(
    readyState,
    (state): RunningService[] | undefined => {
        if (state === undefined) {
            return undefined;
        }

        const { runningServices } = state;

        if (runningServices === undefined) {
            return undefined;
        }

        return [...runningServices].sort((a, b) => b.startedAt - a.startedAt);
    }
);

const isUpdating = (rootState: RootState): boolean => {
    const { isUpdating } = rootState[name];
    return isUpdating;
};

const deletableRunningServiceHelmReleaseNames = createSelector(
    runningServices,
    runningServices =>
        (runningServices ?? [])
            .filter(({ isOwned }) => isOwned)
            .map(({ helmReleaseName }) => helmReleaseName)
);

const isThereNonOwnedServices = createSelector(
    runningServices,
    runningServices =>
        (runningServices ?? []).find(({ isOwned }) => !isOwned) !== undefined
);

const isThereOwnedSharedServices = createSelector(
    runningServices,
    runningServices =>
        (runningServices ?? []).find(({ isOwned, isShared }) => isOwned && isShared) !==
        undefined
);

const commandLogsEntries = createSelector(state, state => state.commandLogsEntries);

export const selectors = {
    runningServices,
    deletableRunningServiceHelmReleaseNames,
    isUpdating,
    isThereNonOwnedServices,
    isThereOwnedSharedServices,
    commandLogsEntries
};
