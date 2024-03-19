import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name, type RunningService } from "./state";
import { assert } from "tsafe/assert";

const state = (rootState: RootState) => rootState[name];

const readyState = createSelector(state, state => {
    if (state.stateDescription !== "ready") {
        return undefined;
    }

    return state;
});

const isReady = createSelector(state, state => state.stateDescription === "ready");

const runningServices = createSelector(
    readyState,
    (state): RunningService[] | undefined => {
        if (state === undefined) {
            return undefined;
        }

        const { runningServices } = state;

        return [...runningServices].sort((a, b) => b.startedAt - a.startedAt);
    }
);

const isUpdating = createSelector(state, state => {
    const { isUpdating } = state;
    return isUpdating;
});

const deletableRunningServiceHelmReleaseNames = createSelector(
    isReady,
    runningServices,
    (isReady, runningServices) => {
        if (!isReady) {
            return undefined;
        }

        assert(runningServices !== undefined);

        return runningServices
            .filter(({ isOwned }) => isOwned)
            .map(({ helmReleaseName }) => helmReleaseName);
    }
);

const isThereNonOwnedServices = createSelector(
    isReady,
    runningServices,
    (isReady, runningServices) => {
        if (!isReady) {
            return undefined;
        }

        assert(runningServices !== undefined);

        return runningServices.find(({ isOwned }) => !isOwned) !== undefined;
    }
);

const isThereOwnedSharedServices = createSelector(
    isReady,
    runningServices,
    (isReady, runningServices) => {
        if (!isReady) {
            return undefined;
        }

        assert(runningServices !== undefined);

        return (
            runningServices.find(({ isOwned, isShared }) => isOwned && isShared) !==
            undefined
        );
    }
);

const commandLogsEntries = createSelector(state, state => state.commandLogsEntries);

const main = createSelector(
    isReady,
    isUpdating,
    runningServices,
    deletableRunningServiceHelmReleaseNames,
    isThereNonOwnedServices,
    isThereOwnedSharedServices,
    commandLogsEntries,
    (
        isReady,
        isUpdating,
        runningServices,
        deletableRunningServiceHelmReleaseNames,
        isThereNonOwnedServices,
        isThereOwnedSharedServices,
        commandLogsEntries
    ) => {
        if (!isReady) {
            return {
                isUpdating,
                commandLogsEntries,
                "runningServices": [],
                "deletableRunningServiceHelmReleaseNames": [],
                "isThereNonOwnedServices": false,
                "isThereOwnedSharedServices": false
            };
        }

        assert(runningServices !== undefined);
        assert(deletableRunningServiceHelmReleaseNames !== undefined);
        assert(isThereNonOwnedServices !== undefined);
        assert(isThereOwnedSharedServices !== undefined);

        return {
            isUpdating,
            commandLogsEntries,
            runningServices,
            deletableRunningServiceHelmReleaseNames,
            isThereNonOwnedServices,
            isThereOwnedSharedServices
        };
    }
);

export const selectors = {
    main
};

const startingRunningServiceHelmReleaseNames = createSelector(
    runningServices,
    runningServices => {
        if (runningServices === undefined) {
            return undefined;
        }

        return runningServices
            .filter(({ status, areAllTasksReady }) => {
                switch (status) {
                    case "deployed":
                        return !areAllTasksReady;
                    case "failed":
                        return false;
                    case "pending-install":
                        return true;
                }
            })
            .map(({ helmReleaseName }) => helmReleaseName);
    }
);

export const protectedSelectors = {
    startingRunningServiceHelmReleaseNames
};
