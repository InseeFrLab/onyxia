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

export const selectors = {
    clusterEvents,
    notificationsCount
};

export const protectedSelectors = {
    isActive
};
