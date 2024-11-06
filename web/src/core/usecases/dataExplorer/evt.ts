import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name, type State } from "./state";
import { assert } from "tsafe/assert";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<{
        actionName: "restoreState";
        queryParams: NonNullable<State["queryParams"]>;
        extraRestorableStates: NonNullable<State["extraRestorableStates"]>;
    }>();

    evtAction
        .pipe(action => (action.usecaseName !== name ? null : [action]))
        .attach(
            ({ actionName }) => actionName === "restoreStateNeeded",
            () => {
                const { queryParams, extraRestorableStates } = getState()[name];

                assert(queryParams !== undefined);
                assert(extraRestorableStates !== undefined);

                evtOut.post({
                    actionName: "restoreState",
                    queryParams,
                    extraRestorableStates
                });
            }
        );

    return evtOut;
}) satisfies CreateEvt;
