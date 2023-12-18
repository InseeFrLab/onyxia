import type { CreateEvt } from "core/bootstrap";
import { name } from "./state";
import { selectors } from "./selectors";
import { Evt } from "evt";
import { Project } from "core/ports/OnyxiaApi";

export const createEvt = (({ evtAction, getState }) => {
    const evt = Evt.create<{
        action: "currentProjectChanged";
        currentProject: Project;
    }>();

    evtAction.attach(
        action => action.usecaseName === name && action.actionName === "projectChanged",
        () =>
            evt.post({
                "action": "currentProjectChanged",
                "currentProject": selectors.currentProject(getState())
            })
    );

    return evt;
}) satisfies CreateEvt;
