import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { assert } from "tsafe/assert";
import type { GridColDef } from "@mui/x-data-grid";

const state = (rootState: RootState) => rootState[name];

const columns = createSelector(
    createSelector(state, state => state.data),
    data => {
        if (data === undefined || data.state !== "loaded") {
            return undefined;
        }

        const columns = data.columns.map(
            column =>
                ({
                    field: column.name,
                    sortable: false,
                    type: (() => {
                        if (column.type === "bigint") return "string";
                        if (column.type === "binary") return "string";
                        return column.type;
                    })()
                }) satisfies GridColDef
        );

        return columns;
    }
);

const main = createSelector(state, columns, (state, columns) => {
    const { isQuerying, queryParams, errorMessage, data, extraRestorableStates } = state;

    if (errorMessage !== undefined) {
        return { isQuerying, errorMessage: errorMessage, queryParams };
    }

    switch (data.state) {
        case "empty":
            return {
                isQuerying,
                rows: undefined
            };
        case "loaded": {
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
                fileDownloadUrl: data.fileDownloadUrl,
                columns
            };
        }
    }
});

export const selectors = { main };
