import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { assert } from "tsafe/assert";

const state = (rootState: RootState) => rootState[name];

const columns = createSelector(
    createSelector(state, state => state.data),
    data => {
        if (data === undefined) {
            return undefined;
        }

        return data.columns;
    }
);

const main = createSelector(state, columns, (state, columns) => {
    const { isQuerying, queryParams, error, data, extraRestorableStates } = state;

    if (error !== undefined) {
        return { isQuerying, error, queryParams };
    }

    if (data === undefined) {
        return {
            isQuerying,
            rows: undefined,
            queryParams
        };
    }

    assert(queryParams !== undefined);
    assert(queryParams.rowsPerPage !== undefined);
    assert(queryParams.page !== undefined);
    assert(extraRestorableStates !== undefined);
    assert(columns !== undefined);

    const { rowsPerPage, page } = queryParams;
    return {
        isQuerying,
        rows: data.rows.map((row, i) => ({
            id: i + rowsPerPage * (page - 1),
            ...row
        })),
        rowCount: data.rowCount,
        queryParams,
        extraRestorableStates,
        columns
    };
});

export const selectors = { main };
