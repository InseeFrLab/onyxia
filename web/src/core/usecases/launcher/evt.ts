import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name } from "./state";
import { privateSelectors } from "./selectors";
import { assert, type Equals } from "tsafe/assert";
import type { ProjectConfigs } from "core/usecases/projectManagement";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";

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
              eventName: "restorableServiceConfigChanged";
              restorableServiceConfig: Pick<
                  ProjectConfigs.RestorableServiceConfig,
                  "friendlyName" | "isShared" | "chartVersion" | "helmValuesPatch"
              >;
          }
    >();

    const evtUsecaseAction = evtAction.pipe(action =>
        action.usecaseName !== name ? null : [action]
    );

    evtUsecaseAction
        .pipe(() => [privateSelectors.restorableConfig(getState())])
        .pipe(onlyIfChanged())
        .pipe(restorableConfig => (restorableConfig === null ? null : [restorableConfig]))
        .attach(restorableConfig => {
            const {
                catalogId,
                chartName,
                chartVersion,
                friendlyName,
                isShared,
                helmValuesPatch,
                ...rest
            } = restorableConfig;
            assert<Equals<typeof rest, {}>>(true);
            evtOut.post({
                "eventName": "restorableServiceConfigChanged",
                "restorableServiceConfig": {
                    friendlyName,
                    isShared,
                    chartVersion,
                    helmValuesPatch
                }
            });
        });

    evtUsecaseAction
        .attach(
            action => action.actionName === "initialized",
            () => evtOut.post({ "eventName": "initialized" })
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
