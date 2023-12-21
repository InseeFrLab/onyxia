import "minimal-polyfills/Object.fromEntries";
import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name } from "./state";
import { protectedSelectors } from "./selectors";

export const createEvt = (({ evtAction, getState }) => {
    const evt = Evt.create<{
        action: "set directory path";
        directoryPath: string;
    }>();

    evtAction.attach(
        data =>
            data.usecaseName === name &&
            (data.actionName === "contextChanged" ||
                data.actionName === "notifyDirectoryPath"),
        () => {
            const { directoryPath } = getState()[name];

            if (directoryPath !== undefined) {
                evt.post({
                    "action": "set directory path",
                    directoryPath
                });
                return;
            }

            const workingDirectoryPath = protectedSelectors.workingDirectoryPath(
                getState()
            );

            evt.post({
                "action": "set directory path",
                "directoryPath": workingDirectoryPath
            });
        }
    );

    return evt;
}) satisfies CreateEvt;
