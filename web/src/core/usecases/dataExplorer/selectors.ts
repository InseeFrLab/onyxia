import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { assert } from "tsafe/assert";
import type { GridColDef } from "@mui/x-data-grid";

const state = (rootState: RootState) => rootState[name];

const columns = createSelector(
    createSelector(
        createSelector(state, state => state.data),
        data => {
            if (data === undefined) {
                return undefined;
            }

            const firstRow = data.rows[0] ?? {};

            const firstRowKeys = Object.keys(firstRow);

            return JSON.stringify(firstRowKeys);
        }
    ),
    firstRowKeys_str => {
        if (firstRowKeys_str === undefined) {
            return undefined;
        }

        const firstRowKeys = JSON.parse(firstRowKeys_str) as string[];

        return firstRowKeys.map(
            key =>
                ({
                    field: key,
                    sortable: false
                }) satisfies GridColDef
        );
    }
);

const main = createSelector(state, columns, (state, columns) => {
    const { isQuerying, queryParams, errorMessage, data } = state;

    if (errorMessage !== undefined) {
        return { isQuerying, errorMessage: errorMessage };
    }

    if (data === undefined) {
        return { isQuerying, rows: undefined };
    }

    assert(columns !== undefined);
    assert(queryParams !== undefined);

    const { rowsPerPage, page } = queryParams;

    return {
        isQuerying,
        rows: data.rows.map((row, i) => ({
            id: i + rowsPerPage * (page - 1),
            ...row
        })),
        rowCount: data.rowCount,
        fileDownloadUrl: data.fileDownloadUrl,
        columns
    };
});

export const selectors = { main };
