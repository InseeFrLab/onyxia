import "minimal-polyfills/Object.fromEntries";
import type { CreateEvt } from "core/core";
import { Evt } from "evt";
import { name } from "./state";
import { assert } from "tsafe/assert";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<{
        actionName: "set catalogue id in url";
        catalogId: string;
    }>();

    evtAction
        .pipe(action => (action.sliceName !== name ? null : [action]))
        .attach(
            ({ actionName }) => actionName === "notifyCatalogIdSelected",
            () => {
                const state = getState()[name];
                assert(state.stateDescription === "ready");
                evtOut.post({
                    "actionName": "set catalogue id in url",
                    "catalogId": state.selectedCatalogId
                });
            }
        );

    return evtOut;
}) satisfies CreateEvt;
