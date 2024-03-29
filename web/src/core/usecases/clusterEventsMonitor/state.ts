import { createUsecaseActions } from "clean-architecture";
import { exclude } from "tsafe/exclude";

export type State = {
    isActive: boolean;
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
    "initialState": (): State => ({
        "clusterEventsByProjectId": loadFromLocalStorage() ?? {},
        "isActive": false
    }),
    "reducers": {
        "enteredActiveState": state => {
            state.isActive = true;
        },
        "exitedActiveState": state => {
            state.isActive = false;
        },
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

            saveToLocalStorage(state.clusterEventsByProjectId);
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

            saveToLocalStorage(state.clusterEventsByProjectId);
        }
    }
});

const { loadFromLocalStorage, saveToLocalStorage } = (() => {
    const localStorageKey = `${name} usecase clusterEventsByProjectId state`;

    function saveToLocalStorage(
        clusterEventsByProjectId: State["clusterEventsByProjectId"]
    ) {
        localStorage.setItem(localStorageKey, JSON.stringify(clusterEventsByProjectId));
    }

    function loadFromLocalStorage(): State["clusterEventsByProjectId"] | undefined {
        const localStorageItem = localStorage.getItem(localStorageKey);

        if (localStorageItem === null) {
            return undefined;
        }

        const clusterEventsByProjectId: State["clusterEventsByProjectId"] =
            JSON.parse(localStorageItem);

        const now = Date.now();

        Object.values(clusterEventsByProjectId)
            .filter(exclude(undefined))
            .forEach(({ clusterEvents }) =>
                clusterEvents
                    .filter(({ timestamp }) => now - timestamp > 3_600_000)
                    .map(olderEvent => clusterEvents.indexOf(olderEvent))
                    .forEach(indexOfOlderEvent =>
                        clusterEvents.splice(indexOfOlderEvent, 1)
                    )
            );

        saveToLocalStorage(clusterEventsByProjectId);

        return clusterEventsByProjectId;
    }

    return { saveToLocalStorage, loadFromLocalStorage };
})();
