import "minimal-polyfills/Object.fromEntries";
import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name } from "./state";
import { assert } from "tsafe/assert";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<{
        actionName: "restoreState";
        queryParams: {
            sourceUrl: string;
            rowsPerPage: number;
            page: number;
        };
        extraRestorableStates: {
            selectedRowIndex: number | undefined;
            columnWidths: Record<string, number> | undefined;
        };
    }>();

    evtAction
        .pipe(action => (action.usecaseName !== name ? null : [action]))
        .attach(
            ({ actionName }) => actionName === "restoreStateNeeded",
            () => {
                const { queryParams, extraRestorableStates } = getState()[name];

                assert(queryParams !== undefined);

                evtOut.post({
                    "actionName": "restoreState",
                    queryParams,
                    extraRestorableStates
                });
            }
        );

    return evtOut;
}) satisfies CreateEvt;
