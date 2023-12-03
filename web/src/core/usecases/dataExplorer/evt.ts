import "minimal-polyfills/Object.fromEntries";
import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name } from "./state";
import { assert } from "tsafe/assert";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<{
        actionName: "restoreState";
        state: {
            sourceUrl: string;
            rowsPerPage: number;
            page: number;
            selectedRowIndex: number | undefined;
        };
    }>();

    evtAction
        .pipe(action => (action.usecaseName !== name ? null : [action]))
        .attach(
            ({ actionName }) => actionName === "restoreStateNeeded",
            () => {
                const { queryParams, selectedRowIndex } = getState()[name];

                assert(queryParams !== undefined);

                evtOut.post({
                    "actionName": "restoreState",
                    "state": {
                        "sourceUrl": queryParams.sourceUrl,
                        "rowsPerPage": queryParams.rowsPerPage,
                        "page": queryParams.page,
                        selectedRowIndex
                    }
                });
            }
        );

    return evtOut;
}) satisfies CreateEvt;
