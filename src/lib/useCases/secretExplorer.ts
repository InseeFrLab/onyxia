import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import type { AppThunk } from "../setup";
import { createObjectThatThrowsIfAccessedFactory, isPropertyAccessedByRedux } from "../utils/createObjectThatThrowsIfAccessed";

const { createObjectThatThrowsIfAccessed } = createObjectThatThrowsIfAccessedFactory(
    { "isPropertyWhitelisted": isPropertyAccessedByRedux }
);

export declare type SecretExplorerState =
    SecretExplorerState.Loaded |
    SecretExplorerState.Loading |
    SecretExplorerState.Failed
    ;

export declare namespace SecretExplorerState {

    export type _Common = {
        currentPath: string;
    };

    export type Loading = _Common & {
        state: "LOADING";
    };

    export type Loaded = _Common & {
        state: "LOADED";
        nodes: string[];
        leafs: string[];
    };

    export type Failed = _Common & {
        state: "FAILED";
        errorMessage: string;
    };


}

export const name = "secretExplorer";

const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<SecretExplorerState>({
        "debugMessage": "Navigation to the default path should have been done in the store initialization"
    }),
    "reducers": {
        "navigationStarted": (...[, { payload }]: [any, PayloadAction<{ path: string; }>]) => {

            const { path } = payload;

            return id<SecretExplorerState.Loading>({
                "state": "LOADING",
                "currentPath": path
            });

        },
        "navigationSuccess": (
            state,
            { payload }: PayloadAction<Pick<SecretExplorerState.Loaded, "nodes" | "leafs">>
        ) => {

            const { nodes, leafs } = payload;

            return id<SecretExplorerState.Loaded>({
                "state": "LOADED",
                "currentPath": state.currentPath,
                leafs,
                nodes
            });

        },
        "navigationFailed": (
            state,
            { payload }: PayloadAction<{ errorMessage: string; }>
        ) => {

            const { errorMessage } = payload;

            return id<SecretExplorerState.Failed>({
                "state": "FAILED",
                "currentPath": state.currentPath,
                errorMessage
            });

        }

    }
});

export { reducer };

export const thunks = {

    "navigateToPath":
        (params: { path: string; }): AppThunk => async (...args) => {

            const { path } = params;

            const [dispatch, , { secretsManagerClient }] = args;

            dispatch(actions.navigationStarted({ path }));

            const listResult = await secretsManagerClient.list({ path })
                .catch((error: Error) => error);

            if (listResult instanceof Error) {

                dispatch(actions.navigationFailed({ "errorMessage": listResult.message }));
                return;

            }

            dispatch(actions.navigationSuccess(listResult));

        }

};



