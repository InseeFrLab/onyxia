import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";

export const createEvt = (({ evtAction }) => {
    const evtOut = Evt.create<{
        actionName: "display notification";
        severity: "warning" | "error";
        message: string;
    }>();

    evtAction.$attach(
        action =>
            action.usecaseName === "clusterEventsMonitor" &&
            action.actionName === "clusterEventReceived"
                ? [action.payload]
                : null,
        ({ clusterEvent }) => {
            if (clusterEvent.severity === "info") {
                return;
            }

            evtOut.post({
                "actionName": "display notification",
                "message": clusterEvent.message,
                "severity": clusterEvent.severity
            });
        }
    );

    return evtOut;
}) satisfies CreateEvt;
