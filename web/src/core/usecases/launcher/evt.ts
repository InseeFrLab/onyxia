import type { CreateEvt } from "core/core";
import { type FormFieldValue } from "./FormField";
import { Evt } from "evt";
import { name } from "./state";
import { privateSelectors } from "./selectors";
import { assert } from "tsafe/assert";

export const createEvt = (({ evtAction, getState }) => {
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
              releaseName: string;
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
        .attach(
            action => action.actionName === "launchCompleted",
            () => {
                const releaseName = privateSelectors.releaseName(getState());
                assert(releaseName !== undefined);
                evtOut.post({ "actionName": "launchCompleted", releaseName });
            }
        );

    return evtOut;
}) satisfies CreateEvt;
