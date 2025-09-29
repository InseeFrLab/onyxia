import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { assert } from "tsafe/assert";

const state = (rootState: RootState) => rootState[name];

export const selectors = {
    main: createSelector(
        state,
        createSelector(
            createSelector(state, state => state.data?.rows),
            createSelector(state, state => state.queryParams?.rowsPerPage),
            createSelector(state, state => state.queryParams?.page),
            (rows, rowsPerPage, page) => {
                if (rows === undefined) {
                    return undefined;
                }
                assert(rowsPerPage !== undefined);
                assert(page !== undefined);

                return rows.map((row, i) => ({
                    id: i + rowsPerPage * (page - 1),
                    ...row
                }));
            }
        ),

        (state, rows) => {
            const { error, isQuerying, queryParams, extraRestorableStates, data } = state;

            if (error !== undefined) {
                return { error, isQuerying, queryParams };
            }

            if (rows === undefined) {
                return {
                    isQuerying,
                    queryParams,
                    rows: undefined
                };
            }

            assert(extraRestorableStates !== undefined);
            assert(queryParams !== undefined);
            assert(data !== undefined);

            return {
                isQuerying,
                queryParams,
                extraRestorableStates,
                rows,
                rowCount: data.rowCount,
                columns: data.columns
            };
        }
    )
};

export const privateSelectors = {
    queryParams: createSelector(state, state => {
        const { queryParams } = state;
        if (queryParams === undefined) {
            return null;
        }
        return queryParams;
    })
};
