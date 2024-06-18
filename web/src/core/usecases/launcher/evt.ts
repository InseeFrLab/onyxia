import type { CreateEvt } from "core/bootstrap";
import { type FormFieldValue } from "./FormField";
import { Evt } from "evt";
import { name } from "./state";
import { privateSelectors } from "./selectors";
import { assert } from "tsafe/assert";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<
        | {
              eventName: "initialized";
              sensitiveConfigurations: FormFieldValue[];
          }
        | {
              eventName: "launchStarted";
          }
        | {
              eventName: "launchCompleted";
              helmReleaseName: string;
          }
        | {
              eventName: "chartVersionChanged";
              chartVersion: string;
          }
        | {
              eventName: "friendlyNameChanged";
              friendlyName: string;
          }
        | {
              eventName: "isSharedChanged";
              isShared: boolean | undefined;
          }
        | {
              eventName: "formFieldsValueDifferentFromDefaultChanged";
              formFieldsValueDifferentFromDefault: FormFieldValue[];
          }
    >();

    evtAction
        .pipe(action => (action.usecaseName !== name ? null : [action]))
        .$attach(
            action => (action.actionName === "initialized" ? [action.payload] : null),
            ({ sensitiveConfigurations }) =>
                evtOut.post({ "eventName": "initialized", sensitiveConfigurations })
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
        )
        .$attach(
            action => (action.actionName !== "initialized" ? null : [action.payload]),
            ({ chartVersion }) =>
                evtOut.post({
                    "eventName": "chartVersionChanged",
                    chartVersion
                })
        )
        .$attach(
            action => {
                switch (action.actionName) {
                    case "initialized":
                        return [action.payload] as const;
                    case "friendlyNameChanged":
                        return [action.payload] as const;
                    default:
                        return null;
                }
            },
            ({ friendlyName }) =>
                evtOut.post({
                    "eventName": "friendlyNameChanged",
                    friendlyName
                })
        )
        .$attach(
            action => {
                switch (action.actionName) {
                    case "initialized":
                        return [action.payload] as const;
                    case "isSharedChanged":
                        return [action.payload] as const;
                    default:
                        return null;
                }
            },
            ({ isShared }) =>
                evtOut.post({
                    "eventName": "isSharedChanged",
                    isShared
                })
        )
        .attach(
            action =>
                action.actionName === "initialized" ||
                action.actionName === "formFieldValueChanged",
            () => {
                const formFieldsValueDifferentFromDefault =
                    privateSelectors.formFieldsValueDifferentFromDefault(getState());

                assert(formFieldsValueDifferentFromDefault !== null);

                evtOut.post({
                    "eventName": "formFieldsValueDifferentFromDefaultChanged",
                    formFieldsValueDifferentFromDefault
                });
            }
        );

    return evtOut;
}) satisfies CreateEvt;
