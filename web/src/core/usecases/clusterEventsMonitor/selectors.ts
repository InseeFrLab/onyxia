import type { State as RootState } from "core/bootstrap";
import * as projectManagement from "core/usecases/projectManagement";
import { createSelector } from "clean-architecture";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const clusterEvents = createSelector(
    state,
    projectManagement.protectedSelectors.currentProject,
    projectManagement.protectedSelectors.projectConfig,
    (state, currentProject, currentProjectConfig) =>
        (state.clusterEventsByProjectId[currentProject.id] ?? []).map(clusterEvent => ({
            ...clusterEvent,
            isHighlighted:
                clusterEvent.severity !== "info" &&
                clusterEvent.timestamp >
                    currentProjectConfig.clusterNotificationCheckoutTime
        }))
);

const notificationsCount = createSelector(
    clusterEvents,
    clusterEvents =>
        clusterEvents.filter(clusterEvent => clusterEvent.isHighlighted).length
);

const isActive = createSelector(state, state => state.isActive);

const lastClusterEvent = createSelector(clusterEvents, clusterEvents => {
    if (clusterEvents.length === 0) {
        return undefined;
    }

    let i = 1;

    while (true) {
        const { message, severity } = clusterEvents[clusterEvents.length - i];

        if (message.includes("probe failed:")) {
            if (i === clusterEvents.length) {
                break;
            }

            i++;
            continue;
        }

        return { message, severity };
    }

    return undefined;
});

export const selectors = {
    clusterEvents,
    notificationsCount,
    lastClusterEvent
};

export const protectedSelectors = {
    isActive
};
