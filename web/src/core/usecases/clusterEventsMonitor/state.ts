import { createUsecaseActions } from "clean-architecture";

export type State = {
    isActive: boolean;
    clusterEventsByProjectId: Record<
        string,
        {
            eventId: string;
            message: string;
            timestamp: number;
            severity: "info" | "warning" | "error";
            originalEvent: Record<string, unknown>;
        }[]
    >;
};

export const name = "clusterEventsMonitor";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: (): State => ({
        clusterEventsByProjectId: {},
        isActive: false
    }),
    reducers: {
        enteredActiveState: state => {
            state.isActive = true;
        },
        exitedActiveState: state => {
            state.isActive = false;
        },
        newClusterEventReceived: (
            state,
            {
                payload
            }: {
                payload: {
                    projectId: string;
                    clusterEvent: {
                        eventId: string;
                        message: string;
                        timestamp: number;
                        severity: "info" | "warning" | "error";
                        originalEvent: Record<string, unknown>;
                    };
                };
            }
        ) => {
            const { projectId, clusterEvent } = payload;

            const clusterEvents = (state.clusterEventsByProjectId[projectId] ??= []);

            const index = clusterEvents.findIndex(
                ({ timestamp }) => timestamp > clusterEvent.timestamp
            );

            if (index === -1) {
                clusterEvents.push(clusterEvent);
            } else {
                clusterEvents.splice(index, 0, clusterEvent);
            }
        }
    }
});
