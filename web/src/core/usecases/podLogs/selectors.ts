import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { assert } from "tsafe/assert";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const logs = createSelector(state, state => {
    const { currentPod, logsByPodNameByHelmReleaseNameByProjectId } = state;

    if (currentPod === undefined) {
        return undefined;
    }

    const logs =
        logsByPodNameByHelmReleaseNameByProjectId[currentPod.projectId]?.[
            currentPod.helmReleaseName
        ]?.[currentPod.podName];

    if (logs === undefined) {
        return undefined;
    }

    return logs;
});

const isReady = createSelector(logs, logs => {
    if (logs === undefined) {
        return false;
    }

    return true;
});

const podName = createSelector(isReady, state, (isReady, state) => {
    if (!isReady) {
        return undefined;
    }

    assert(state.currentPod !== undefined);

    return state.currentPod.podName;
});

const paginatedLogs = createSelector(isReady, logs, (isReady, logs) => {
    if (!isReady) {
        return undefined;
    }

    assert(logs !== undefined);

    const lines = logs
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "");

    const paginatedLogs: string[] = [];

    for (let i = 0; i < lines.length; i += 50) {
        paginatedLogs.push(lines.slice(i, i + 50).join("\n"));
    }

    return paginatedLogs;
});

const main = createSelector(
    isReady,
    podName,
    paginatedLogs,
    (isReady, podName, paginatedLogs) => {
        if (!isReady) {
            return {
                isReady: false as const
            };
        }

        assert(paginatedLogs !== undefined);
        assert(podName !== undefined);

        return {
            isReady: true,
            podName,
            paginatedLogs
        };
    }
);

export const selectors = {
    main
};
