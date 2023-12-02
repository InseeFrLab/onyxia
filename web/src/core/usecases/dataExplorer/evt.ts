import "minimal-polyfills/Object.fromEntries";
import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name } from "./state";
import { assert } from "tsafe/assert";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<{
        actionName: "restoreQueryParams";
        queryParams: {
            sourceUrl: string;
            rowsPerPage: number;
            page: number;
        };
    }>();

    evtAction
        .pipe(action => (action.usecaseName !== name ? null : [action]))
        .attach(
            ({ actionName }) => actionName === "restoreStateNeeded",
            () => {
                const { queryParams } = getState()[name];

                assert(queryParams !== undefined);

                console.log({ queryParams });

                evtOut.post({
                    "actionName": "restoreQueryParams",
                    queryParams
                });
            }
        );

    return evtOut;
}) satisfies CreateEvt;
