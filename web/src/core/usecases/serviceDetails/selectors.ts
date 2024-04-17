import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { assert } from "tsafe/assert";
import { name } from "./state";
import { nestObject } from "core/tools/nestObject";
import YAML from "yaml";

const state = (rootState: RootState) => rootState[name];

const readyState = createSelector(state, state => {
    if (state.stateDescription !== "ready") {
        return undefined;
    }

    return state;
});

const isReady = createSelector(state, state => state.stateDescription === "ready");

const helmReleaseName = createSelector(state, state => {
    if (state.stateDescription === "not initialized" && !state.isFetching) {
        return undefined;
    }

    const { helmReleaseName } = state;

    return helmReleaseName;
});

const helmReleaseFriendlyName = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { helmReleaseFriendlyName } = state;

    return helmReleaseFriendlyName;
});

const paginatedLogsByPodName = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return Object.fromEntries(
        Object.entries(state.logsByPodName).map(([podName, logs]) => [
            podName,
            (() => {
                const lines = logs
                    .split("\n")
                    .map(line => line.trim())
                    .filter(line => line !== "");

                const paginatedLogs: string[] = [];

                for (let i = 0; i < lines.length; i += 50) {
                    paginatedLogs.push(lines.slice(i, i + 50).join("\n"));
                }

                return paginatedLogs;
            })()
        ])
    );
});

const podNames = createSelector(paginatedLogsByPodName, paginatedLogsByPodName => {
    if (paginatedLogsByPodName === undefined) {
        return undefined;
    }

    return Object.keys(paginatedLogsByPodName).sort();
});

const formattedHelmValues = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { helmValues } = state;

    return YAML.stringify(
        nestObject(
            Object.fromEntries(
                Object.entries(helmValues).map(([key, value]) => [
                    key,
                    (() => {
                        switch (value) {
                            case "true":
                                return true;
                            case "false":
                                return false;
                            default:
                                return value;
                        }
                    })()
                ])
            )
        )
    );
});

const commandLogsEntries = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.commandLogsEntries;
});

const monitoringUrl = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { monitoringUrl } = state;

    return monitoringUrl;
});

const main = createSelector(
    isReady,
    helmReleaseFriendlyName,
    podNames,
    paginatedLogsByPodName,
    formattedHelmValues,
    monitoringUrl,
    commandLogsEntries,
    (
        isReady,
        helmReleaseFriendlyName,
        podNames,
        paginatedLogsByPodName,
        formattedHelmValues,
        monitoringUrl,
        commandLogsEntries
    ) => {
        if (!isReady) {
            return {
                "isReady": false as const,
                helmReleaseName
            };
        }

        assert(helmReleaseFriendlyName !== undefined);
        assert(paginatedLogsByPodName !== undefined);
        assert(formattedHelmValues !== undefined);
        assert(podNames !== undefined);
        assert(commandLogsEntries !== undefined);

        return {
            "isReady": true,
            helmReleaseFriendlyName,
            podNames,
            paginatedLogsByPodName,
            formattedHelmValues,
            monitoringUrl,
            commandLogsEntries
        };
    }
);

export const selectors = {
    main
};

export const protectedSelectors = {
    helmReleaseName
};
