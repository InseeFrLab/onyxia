import type { CreateEvt } from "core/bootstrap";
import { name } from "./state";
import { Evt } from "evt";

export const createEvt = (({ evtAction }) => {
    const evtOut = Evt.create<{
        actionName: "redirect away";
    }>();

    evtAction.attach(
        action =>
            action.usecaseName === "projectManagement" &&
            action.actionName === "projectChanged",
        () => {
            evtOut.post({ actionName: "redirect away" });
        }
    );

    evtAction.attach(
        action =>
            action.usecaseName === name &&
            action.actionName === "notifyHelmReleaseNoLongerExists",
        () => {
            evtOut.post({ actionName: "redirect away" });
        }
    );

    return evtOut;
}) satisfies CreateEvt;
