import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { same } from "evt/tools/inDepth/same";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";

export const thunks = {
    "setQueryParams":
        (params: { source: string; limit: number; offset: number }) =>
        async (...args) => {
            const { source, limit, offset } = params;

            const [dispatch, getState, rootContext] = args;

            const { sqlOlap } = rootContext;

            // NOTE: Preload for minimizing load time when querying.
            sqlOlap.getDb();

            if (!source.endsWith(".parquet") && !source.endsWith(".csv")) {
                return;
            }

            if (same(getState()[name].queryParams, { source, limit, offset })) {
                return;
            }

            const { waitForDebounce } = getContext(rootContext);

            await waitForDebounce();

            dispatch(
                actions.queryStarted({
                    "queryParams": { source, limit, offset }
                })
            );

            const dataOrErrorMessage = await sqlOlap
                .getData({ "sourceUrl": source, limit, offset })
                .catch(error => {
                    return String(error);
                });

            if (!same(getState()[name].queryParams, { source, limit, offset })) {
                //An other query has been made in the meantime
                return;
            }

            if (typeof dataOrErrorMessage === "string") {
                dispatch(
                    actions.queryFailed({
                        "errorMessage": dataOrErrorMessage
                    })
                );

                return;
            }

            dispatch(actions.querySucceeded({ "data": dataOrErrorMessage }));
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => {
    const { waitForDebounce } = waitForDebounceFactory({
        "delay": 200
    });

    return {
        waitForDebounce
    };
});
