import type { State as RootState } from "core/bootstrap";
import { createSelector } from "redux-clean-architecture";
import { name } from "./state";
import { assert } from "tsafe/assert";
import type { GridColDef } from "@mui/x-data-grid";

const state = (rootState: RootState) => rootState[name];

const columns = createSelector(state, state => {
    const { data } = state;

    if (data === undefined) {
        return undefined;
    }

    const { rows } = data;

    if (rows.length === 0) {
        return [];
    }

    const firstRow = rows[0];

    return Object.keys(firstRow).map(
        propertyName =>
            ({
                "field": propertyName,
                "sortable": false
            } satisfies GridColDef)
    );
});

const main = createSelector(state, columns, (state, columns) => {
    const { isQuerying, queryParams, errorMessage, data } = state;

    if (errorMessage !== undefined) {
        return { isQuerying, "errorMessage": errorMessage };
    }

    if (data === undefined) {
        return { isQuerying, "rows": undefined };
    }

    assert(columns !== undefined);
    assert(queryParams !== undefined);

    const { rowsPerPage, page } = queryParams;

    return {
        isQuerying,
        "rows": data.rows.map((row, i) => ({
            "id": i + rowsPerPage * (page - 1),
            ...row
        })),
        "rowCount": data.rowCount,
        "fileDownloadUrl": data.fileDownloadUrl,
        columns
    };
});

export const selectors = { main };
