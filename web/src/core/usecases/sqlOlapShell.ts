import type { Thunks } from "../core";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import type { State as RootState } from "../core";
import { createSelector } from "@reduxjs/toolkit";
import { assert } from "tsafe/assert";
import { createUsecaseContextApi } from "redux-clean-architecture";
import type { SqlOlap } from "core/ports/SqlOlap";
import type { ReturnType } from "tsafe";

type State = {
    isReady: boolean;
};

export const name = "sqlOlapShell";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<State>({
        "isReady": false
    }),
    "reducers": {
        "ready": state => {
            state.isReady = true;
        }
    }
});

export const thunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, , extraArg] = args;

            const { sqlOlap } = extraArg;

            const db = await sqlOlap.getDb();

            setContext(extraArg, { db });

            dispatch(actions.ready());
        },
    "getDb":
        () =>
        (...args) => {
            const [, getState, extraArg] = args;

            const state = getState()[name];

            assert(
                state.isReady,
                "Must wait for initialization before calling this thunk"
            );

            const { db } = getContext(extraArg);

            return db;
        }
} satisfies Thunks;

const { getContext, setContext } = createUsecaseContextApi<{
    db: ReturnType<SqlOlap["getDb"]>;
}>();

export const selectors = (() => {
    const state = (rootState: RootState): State => rootState[name];

    const isReady = createSelector([state], state => state.isReady);

    return { isReady };
})();
