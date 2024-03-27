import type { State as RootState } from "core/bootstrap";
import * as projectManagement from "core/usecases/projectManagement";
import { createSelector } from "clean-architecture";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const scopedState = createSelector(
    state,
    projectManagement.selectors.currentProject,
    (state, currentProject) => {
        const scopedState = state.clusterEventsByProjectId[currentProject.id];

        if (scopedState === undefined) {
            return {
                "clusterEvents": [],
                "notificationCheckoutTime": 0
            };
        }

        return scopedState;
    }
);

const clusterEvents = createSelector(scopedState, scopedState => {
    const { clusterEvents, notificationCheckoutTime } = scopedState;

    return clusterEvents.map(clusterEvent => ({
        ...clusterEvent,
        "isHighlighted":
            clusterEvent.severity !== "info" &&
            clusterEvent.timestamp > notificationCheckoutTime
    }));
});

const notificationsCount = createSelector(
    clusterEvents,
    clusterEvents =>
        clusterEvents.filter(clusterEvent => clusterEvent.isHighlighted).length
);

export const selectors = {
    clusterEvents,
    notificationsCount
};
