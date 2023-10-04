import "minimal-polyfills/Object.fromEntries";
import type { CreateEvt } from "core/core";
import { type FormFieldValue } from "./FormField";
import { Evt } from "evt";
import { name } from "./state";

export const createEvt = (({ evtAction }) => {
    const evtOut = Evt.create<
        | {
              actionName: "initialized";
              sensitiveConfigurations: FormFieldValue[];
          }
        | {
              actionName: "launchStarted";
          }
        | {
              actionName: "launchCompleted";
              serviceId: string;
          }
    >();

    evtAction
        .pipe(action => (action.sliceName !== name ? null : [action]))
        .$attach(
            action => (action.actionName === "initialized" ? [action.payload] : null),
            ({ sensitiveConfigurations }) =>
                evtOut.post({ "actionName": "initialized", sensitiveConfigurations })
        )
        .attach(
            action => action.actionName === "launchStarted",
            () => evtOut.post({ "actionName": "launchStarted" })
        )
        .$attach(
            action => (action.actionName === "launchCompleted" ? [action.payload] : null),
            ({ serviceId }) => evtOut.post({ "actionName": "launchCompleted", serviceId })
        );

    return evtOut;
}) satisfies CreateEvt;
