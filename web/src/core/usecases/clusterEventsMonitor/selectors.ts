import type { State as RootState } from "core/bootstrap";
import * as projectManagement from "core/usecases/projectManagement";
import { createSelector } from "clean-architecture";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const clusterEvents = createSelector(
    state,
    projectManagement.selectors.currentProject,
    projectManagement.protectedSelectors.currentProjectConfigs,
    (state, currentProject, currentProjectConfigs) =>
        (state.clusterEventsByProjectId[currentProject.id] ?? []).map(clusterEvent => ({
            ...clusterEvent,
            "isHighlighted":
                clusterEvent.severity !== "info" &&
                clusterEvent.timestamp >
                    currentProjectConfigs.clusterNotificationCheckoutTime
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

    const { message, severity } = clusterEvents[clusterEvents.length - 1];

    return { message, severity };
});

export const selectors = {
    clusterEvents,
    notificationsCount,
    lastClusterEvent
};

export const protectedSelectors = {
    isActive
};
