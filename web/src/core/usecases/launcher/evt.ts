import type { CreateEvt } from "core/bootstrap";
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
              helmReleaseName: string;
          }
        | {
              actionName: "chartVersionInternallySet";
              chartVersion: string;
          }
    >();

    evtAction
        .pipe(action => (action.usecaseName !== name ? null : [action]))
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
                const helmReleaseName = privateSelectors.helmReleaseName(getState());
                assert(helmReleaseName !== undefined);
                evtOut.post({ "actionName": "launchCompleted", helmReleaseName });
            }
        )
        .attach(
            action => action.actionName === "defaultChartVersionSelected",
            () => {
                const state = getState()[name];
                assert(state.stateDescription === "ready");
                evtOut.post({
                    "actionName": "chartVersionInternallySet",
                    "chartVersion": state.chartVersion
                });
            }
        );

    return evtOut;
}) satisfies CreateEvt;
