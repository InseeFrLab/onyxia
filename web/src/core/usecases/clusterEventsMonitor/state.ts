import { createUsecaseActions } from "clean-architecture";
import { exclude } from "tsafe/exclude";

export type State = {
    clusterEventsByProjectId: Record<
        string,
        | {
              clusterEvents: {
                  message: string;
                  timestamp: number;
                  severity: "info" | "warning" | "error";
                  originalEvent: Record<string, unknown>;
              }[];
              notificationCheckoutTime: number;
          }
        | undefined
    >;
};

export const name = "clusterEventsMonitor";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": (): State =>
        loadFromLocalStorage() ?? { "clusterEventsByProjectId": {} },
    "reducers": {
        "clusterEventReceived": (
            state,
            {
                payload
            }: {
                payload: {
                    projectId: string;
                    clusterEvent: {
                        message: string;
                        timestamp: number;
                        severity: "info" | "warning" | "error";
                        originalEvent: Record<string, unknown>;
                    };
                };
            }
        ) => {
            const { projectId, clusterEvent } = payload;

            const scopedState = (state.clusterEventsByProjectId[projectId] ??= {
                "clusterEvents": [],
                "notificationCheckoutTime": 0
            });

            const existingEvent = scopedState.clusterEvents.find(
                ({ timestamp }) => clusterEvent.timestamp === timestamp
            );

            if (existingEvent !== undefined) {
                return;
            }

            scopedState.clusterEvents.push(clusterEvent);

            scopedState.clusterEvents.sort((a, b) => a.timestamp - b.timestamp);

            if (scopedState.clusterEvents.length > 100) {
                scopedState.clusterEvents.shift();
            }

            saveToLocalStorage(state);
        },
        "notificationCheckedOut": (
            state,
            { payload }: { payload: { projectId: string } }
        ) => {
            const { projectId } = payload;

            const scopedState = state.clusterEventsByProjectId[projectId];

            if (scopedState === undefined) {
                return;
            }

            scopedState.notificationCheckoutTime = Date.now();

            saveToLocalStorage(state);
        }
    }
});

const { loadFromLocalStorage, saveToLocalStorage } = (() => {
    const localStorageKey = `${name} usecase state`;

    function saveToLocalStorage(state: State) {
        localStorage.setItem(localStorageKey, JSON.stringify(state));
    }

    function loadFromLocalStorage(): State | undefined {
        const localStorageItem = localStorage.getItem(localStorageKey);

        if (localStorageItem === null) {
            return undefined;
        }

        const state: State = JSON.parse(localStorageItem);

        const now = Date.now();

        Object.values(state.clusterEventsByProjectId)
            .filter(exclude(undefined))
            .forEach(({ clusterEvents }) =>
                clusterEvents
                    .filter(({ timestamp }) => now - timestamp > 3_600_000)
                    .map(olderEvent => clusterEvents.indexOf(olderEvent))
                    .forEach(indexOfOlderEvent =>
                        clusterEvents.splice(indexOfOlderEvent, 1)
                    )
            );

        saveToLocalStorage(state);

        return state;
    }

    return { saveToLocalStorage, loadFromLocalStorage };
})();
