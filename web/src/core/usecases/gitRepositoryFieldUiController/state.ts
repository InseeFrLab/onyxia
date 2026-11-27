import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import {
    updateRepositorySearchCache,
    type RepositorySearchCache
} from "core/usecases/gitForgesManagement/decoupledLogic/repositorySearch";
import type { GitRepository } from "core/ports/GitForge";
import type { FieldState, Mode } from "./decoupledLogic";

export const name = "gitRepositoryFieldUiController";

/**
 * The launcher's render: "gitRepository" fields: what the user did in each of them.
 * Their value is in the launcher's helm values, the forges in
 * gitForgesManagement and gitAccountUiController.
 */
export type State = {
    fieldStateByFieldId: Record<string, FieldState>;
    /** By forge and account, shared by the fields, see getRepositorySearchCacheKey */
    repositorySearchCacheByKey: Record<string, RepositorySearchCache | undefined>;
};

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        fieldStateByFieldId: {},
        repositorySearchCacheByKey: {}
    }),
    reducers: {
        fieldInitialized: (
            state,
            { payload }: { payload: { fieldId: string; fieldState: FieldState } }
        ) => {
            state.fieldStateByFieldId[payload.fieldId] = payload.fieldState;
        },
        fieldCleanedUp: (state, { payload }: { payload: { fieldId: string } }) => {
            delete state.fieldStateByFieldId[payload.fieldId];

            // NOTE: Searched again next time, the repositories may have changed.
            if (Object.keys(state.fieldStateByFieldId).length === 0) {
                state.repositorySearchCacheByKey = {};
            }
        },
        modeChanged: (
            state,
            { payload }: { payload: { fieldId: string; mode: Mode; urlInput: string } }
        ) => {
            const fieldState = getFieldState(state, payload.fieldId);

            fieldState.mode_selected = payload.mode;
            fieldState.urlInput = payload.urlInput;
        },
        forgeSelected: (
            state,
            { payload }: { payload: { fieldId: string; forgeId: string } }
        ) => {
            const fieldState = getFieldState(state, payload.fieldId);

            fieldState.forgeId_selected = payload.forgeId;
            fieldState.search = "";
        },
        searchChanged: (
            state,
            { payload }: { payload: { fieldId: string; search: string } }
        ) => {
            getFieldState(state, payload.fieldId).search = payload.search;
        },
        urlInputChanged: (
            state,
            {
                payload
            }: {
                payload: {
                    fieldId: string;
                    urlInput: string;
                    /** Typing switches to the url mode */
                    isTyped: boolean;
                    /** The forge of a url on a connected forge */
                    forgeId_selected: string | undefined;
                };
            }
        ) => {
            const fieldState = getFieldState(state, payload.fieldId);

            fieldState.urlInput = payload.urlInput;

            if (payload.isTyped) {
                fieldState.mode_selected = "url";
            }

            if (payload.forgeId_selected !== undefined) {
                fieldState.forgeId_selected = payload.forgeId_selected;
            }
        },
        moreRepositoriesRequested: (
            state,
            {
                payload
            }: {
                payload: {
                    fieldId: string;
                    moreRequest: { forgeId: string; search: string; page: number };
                };
            }
        ) => {
            const fieldState = getFieldState(state, payload.fieldId);

            fieldState.failedSearch = undefined;
            fieldState.moreRequest = payload.moreRequest;
            fieldState.moreRequestCount++;
        },
        repositorySearchStarted: (
            state,
            { payload }: { payload: { fieldId: string } }
        ) => {
            getFieldState(state, payload.fieldId).failedSearch = undefined;
        },
        repositorySearchCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    cacheKey: string;
                    search: string;
                    page: number;
                    repositories: GitRepository[];
                    hasNextPage: boolean;
                };
            }
        ) => {
            const { cacheKey, search, page, repositories, hasNextPage } = payload;

            state.repositorySearchCacheByKey[cacheKey] = updateRepositorySearchCache({
                cache: state.repositorySearchCacheByKey[cacheKey],
                search,
                page,
                repositories,
                hasNextPage
            });
        },
        repositorySearchFailed: (
            state,
            { payload }: { payload: { fieldId: string; forgeId: string; search: string } }
        ) => {
            const { fieldId, forgeId, search } = payload;

            const fieldState = state.fieldStateByFieldId[fieldId];

            // NOTE: The field may be gone in the meantime.
            if (fieldState === undefined) {
                return;
            }

            fieldState.failedSearch = { forgeId, search };
        },
        branchSearchChanged: (
            state,
            { payload }: { payload: { fieldId: string; branchSearch: string } }
        ) => {
            getFieldState(state, payload.fieldId).branchSearch = payload.branchSearch;
        },
        branchesChanged: (
            state,
            {
                payload
            }: { payload: { fieldId: string; branches: FieldState["branches"] } }
        ) => {
            const fieldState = state.fieldStateByFieldId[payload.fieldId];

            // NOTE: The field may be gone in the meantime.
            if (fieldState === undefined) {
                return;
            }

            fieldState.branches = payload.branches;
        }
    }
});

function getFieldState(state: State, fieldId: string): FieldState {
    const fieldState = state.fieldStateByFieldId[fieldId];

    assert(fieldState !== undefined, `Field ${fieldId} not initialized`);

    return fieldState;
}
