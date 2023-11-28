import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { same } from "evt/tools/inDepth/same";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";

export const thunks = {
    "setQueryParams":
        (params: { source: string; rowsPerPage: number; page: number }) =>
        async (...args) => {
            const { source, rowsPerPage, page } = params;

            const [dispatch, getState, rootContext] = args;

            const { sqlOlap } = rootContext;

            // NOTE: Preload for minimizing load time when querying.
            sqlOlap.getDb();

            if (!source.endsWith(".parquet") && !source.endsWith(".csv")) {
                return;
            }

            if (same(getState()[name].queryParams, { source, rowsPerPage, page })) {
                return;
            }

            const { waitForDebounce } = getContext(rootContext);

            await waitForDebounce();

            dispatch(
                actions.queryStarted({
                    "queryParams": { source, rowsPerPage, page }
                })
            );

            const getIsActive = () =>
                same(getState()[name].queryParams, { source, rowsPerPage, page });

            const rowCountOrErrorMessage = await sqlOlap
                .getRowCount(source)
                .catch(error => String(error));

            if (!getIsActive()) {
                //An other query has been made in the meantime
                return;
            }

            if (typeof rowCountOrErrorMessage === "string") {
                dispatch(
                    actions.queryFailed({
                        "errorMessage": rowCountOrErrorMessage
                    })
                );

                return;
            }

            const rowsOrErrorMessage = await sqlOlap
                .getRows({ "sourceUrl": source, rowsPerPage, page })
                .catch(error => String(error));

            if (!getIsActive()) {
                //An other query has been made in the meantime
                return;
            }

            if (typeof rowsOrErrorMessage === "string") {
                dispatch(
                    actions.queryFailed({
                        "errorMessage": rowsOrErrorMessage
                    })
                );

                return;
            }

            dispatch(
                actions.querySucceeded({
                    "rows": rowsOrErrorMessage,
                    "rowCount": rowCountOrErrorMessage
                })
            );
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
