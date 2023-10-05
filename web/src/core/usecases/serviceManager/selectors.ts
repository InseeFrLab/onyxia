import type { State as RootState } from "core/core";
import { createSelector } from "@reduxjs/toolkit";

import { name, type RunningService } from "./state";

const runningServices = (rootState: RootState): RunningService[] | undefined => {
    const { runningServices } = rootState[name];

    if (runningServices === undefined) {
        return undefined;
    }

    return [...runningServices].sort((a, b) => b.startedAt - a.startedAt);
};

const isUpdating = (rootState: RootState): boolean => {
    const { isUpdating } = rootState[name];
    return isUpdating;
};

const deletableRunningServices = createSelector(runningServices, runningServices =>
    (runningServices ?? []).filter(({ isOwned }) => isOwned)
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

export const selectors = {
    runningServices,
    deletableRunningServices,
    isUpdating,
    isThereNonOwnedServices,
    isThereOwnedSharedServices
};
