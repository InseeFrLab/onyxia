import type { CreateEvt } from "core/bootstrap";
import { type FormFieldValue } from "./FormField";
import { Evt } from "evt";
import { name } from "./state";
import { privateSelectors } from "./selectors";
import { assert, type Equals } from "tsafe/assert";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<
        | {
              eventName: "initialized";
          }
        | {
              eventName: "launchStarted";
          }
        | {
              eventName: "launchCompleted";
              helmReleaseName: string;
          }
        | {
              eventName: "initializationParamsChanged";
              friendlyName: string;
              chartVersion: string;
              isShared: boolean | undefined;
              formFieldsValueDifferentFromDefault: FormFieldValue[];
          }
    >();

    evtAction
        .pipe(action => (action.usecaseName !== name ? null : [action]))
        .attach(
            action => action.actionName === "initialized",
            () => evtOut.post({ "eventName": "initialized" })
        )
        .attach(
            action =>
                action.actionName === "initialized" ||
                action.actionName === "friendlyNameChanged" ||
                action.actionName === "isSharedChanged" ||
                action.actionName === "formFieldValueChanged",
            () => {
                const restorableConfig = privateSelectors.restorableConfig(getState());
                assert(restorableConfig !== null);
                const {
                    catalogId,
                    chartName,
                    chartVersion,
                    formFieldsValueDifferentFromDefault,
                    friendlyName,
                    isShared,
                    ...rest
                } = restorableConfig;
                assert<Equals<typeof rest, {}>>(true);
                evtOut.post({
                    "eventName": "initializationParamsChanged",
                    friendlyName,
                    chartVersion,
                    isShared,
                    formFieldsValueDifferentFromDefault
                });
            }
        )
        .attach(
            action => action.actionName === "launchStarted",
            () => evtOut.post({ "eventName": "launchStarted" })
        )
        .attach(
            action => action.actionName === "launchCompleted",
            () => {
                const helmReleaseName = privateSelectors.helmReleaseName(getState());
                assert(helmReleaseName !== null);
                evtOut.post({ "eventName": "launchCompleted", helmReleaseName });
            }
        );

    return evtOut;
}) satisfies CreateEvt;
