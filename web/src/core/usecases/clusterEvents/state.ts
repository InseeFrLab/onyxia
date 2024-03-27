import { createUsecaseActions } from "clean-architecture";

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
              notificationCount: number;
          }
        | undefined
    >;
};

export const name = "custerEvents";

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
                "notificationCount": 0
            });

            const existingEvent = scopedState.clusterEvents.find(
                ({ timestamp }) => clusterEvent.timestamp === timestamp
            );

            if (existingEvent !== undefined) {
                return;
            }

            if (scopedState.clusterEvents.length > 100) {
                scopedState.clusterEvents.shift();
            }

            scopedState.clusterEvents.push(clusterEvent);

            if (
                clusterEvent.severity === "warning" ||
                clusterEvent.severity === "error"
            ) {
                scopedState.notificationCount++;
            }

            saveToLocalStorage(state);
        },
        "notificationCountReset": (
            state,
            { payload }: { payload: { projectId: string } }
        ) => {
            const { projectId } = payload;

            const scopedState = state.clusterEventsByProjectId[projectId];

            if (scopedState === undefined) {
                return;
            }

            scopedState.notificationCount = 0;

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

        return JSON.parse(localStorageItem);
    }

    return { saveToLocalStorage, loadFromLocalStorage };
})();
