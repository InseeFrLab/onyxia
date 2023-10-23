import "minimal-polyfills/Object.fromEntries";
import type { CreateEvt } from "core/core";
import { Evt } from "evt";
import { name } from "./state";
import { assert } from "tsafe/assert";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<{
        actionName: "catalogIdInternallySet";
        catalogId: string;
    }>();

    evtAction
        .pipe(action => (action.sliceName !== name ? null : [action]))
        .attach(
            ({ actionName }) => actionName === "defaultCatalogSelected",
            () => {
                const state = getState()[name];
                assert(state.stateDescription === "ready");
                evtOut.post({
                    "actionName": "catalogIdInternallySet",
                    "catalogId": state.selectedCatalogId
                });
            }
        );

    return evtOut;
}) satisfies CreateEvt;
