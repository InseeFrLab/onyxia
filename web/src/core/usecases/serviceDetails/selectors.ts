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

const podNames = createSelector(readyState, readyState => {
    if (readyState === undefined) {
        return undefined;
    }

    return readyState.podNames;
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

    return [state.commandLogsEntry];
});

const monitoringUrl = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { monitoringUrl } = state;

    return monitoringUrl;
});

const selectedPodName = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.selectedPodName;
});

const isCommandBarExpanded = createSelector(readyState, state => {
    if (state === undefined) {
        return false;
    }

    return state.isCommandBarExpanded;
});

const overviewState = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return {
        commandLogsEntries: state.commandLogsEntry
    };
});

const helmState = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return {
        releaseName: state.helmReleaseName,
        values: state.helmValues
    };
});
const main = createSelector(
    isReady,
    helmReleaseFriendlyName,
    podNames,
    selectedPodName,
    monitoringUrl,
    commandLogsEntries,
    isCommandBarExpanded,
    (
        isReady,
        helmReleaseFriendlyName,
        podNames,
        selectedPodName,
        monitoringUrl,
        commandLogsEntries,
        isCommandBarExpanded
    ) => {
        if (!isReady) {
            return {
                isReady: false as const,
                helmReleaseName
            };
        }

        assert(helmReleaseFriendlyName !== undefined);
        assert(podNames !== undefined);
        // assert(selectedPodName !== undefined);
        assert(commandLogsEntries !== undefined);

        return {
            isReady: true,
            helmReleaseFriendlyName,
            podNames,
            selectedPodName,
            monitoringUrl,
            commandLogsEntries,
            isCommandBarExpanded
        };
    }
);

export const selectors = {
    main
};

export const protectedSelectors = {
    formattedHelmValues,
    isCommandBarExpanded
};

type MainSelectorNew =
    | {
          isReady: false;
          helmReleaseName: string;
      }
    | ReadyType;

type ReadyType = {
    isReady: true;
    helmRelease: {
        friendlyName: string;
        revision: number;
        state:
            | "unknown"
            | "deployed"
            | "uninstalled"
            | "superseded"
            | "failed"
            | "uninstalling"
            | "pending-install"
            | "pending-upgrade"
            | "pending-rollback";
        updated: number;
        chatName: string;
        version: string;
    };
    k8s: Controller[];
    imageName: string;
    monitoringUrl: string | undefined;
    commandLogsEntries: {
        cmdId: number;
        cmd: string;
        resp: string;
    }[];
};

type Controller = {
    healthy: boolean;
    name: string;
    kind: "StatefulSet" | "Deployment" | "DaemonSet";
    pods: Pod[];
    replicaCount: number;
};

type Pod = {
    name: string;
    state: "Pending" | "Running" | "Succeeded" | "Failed" | "Unknown";
    reason: string | undefined; //PodInitializing ....
    container: Container[];
};

type Container = {
    ready: boolean;
    name: string;
    ressources: Ressources;
};

type Ressources = {
    limits: Resource;
    requests: Resource;
};

type Resource = { cpu: string; memory: string };
