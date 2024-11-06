import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { protectedSelectors } from "./selectors";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<{
        actionName: "display notification";
        severity: "warning" | "error";
        message: string;
    }>();

    evtAction.$attach(
        action =>
            action.usecaseName === "clusterEventsMonitor" &&
            action.actionName === "newClusterEventReceived"
                ? [action.payload]
                : null,
        async ({ clusterEvent }) => {
            if (
                clusterEvent.severity === "info" ||
                Date.now() - clusterEvent.timestamp > 7_000
            ) {
                return;
            }

            if (!protectedSelectors.isActive(getState())) {
                try {
                    await evtAction.waitFor(
                        action =>
                            action.usecaseName === "clusterEventsMonitor" &&
                            action.actionName === "enteredActiveState",
                        15_000
                    );
                } catch {
                    // Timeout
                    return;
                }
            }

            evtOut.post({
                actionName: "display notification",
                message: clusterEvent.message,
                severity: clusterEvent.severity
            });
        }
    );

    return evtOut;
}) satisfies CreateEvt;
