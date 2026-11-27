import type { Thunks } from "core/bootstrap";
import { assert } from "tsafe/assert";
import { Evt } from "evt";
import { createUsecaseContextApi } from "clean-architecture";
import type { GitRepository } from "core/ports/GitForge";
import * as gitForgesManagement from "core/usecases/gitForgesManagement";
import * as launcher from "core/usecases/launcher";
import { getValueAtPath } from "core/tools/Stringifyable/getValueAtPath";
import { getGitRepositoryValue } from "core/usecases/launcher/decoupledLogic/shared/getGitRepositoryValue";
import { actions, name } from "./state";
import { privateSelectors } from "./selectors";
import {
    createFieldState,
    emptyValue,
    getFieldId,
    getUrlInputOfValue,
    getValueOfUrlInput,
    type BranchesRequest,
    type Mode,
    type RepositoriesRequest,
    type Value
} from "./decoupledLogic";

const SEARCH_DEBOUNCE_MS = 300;

/** What is running for a field, the requests are made again when their key changes */
type FieldContext = {
    repositories: Request | undefined;
    branches: Request | undefined;
    /** The value the url input was last synchronized with */
    valueUrl: string;
};

type Request = {
    key: string;
    abort: () => void;
};

const { getContext } = createUsecaseContextApi(() => ({
    fieldContextByFieldId: new Map<string, FieldContext>()
}));

export const thunks = {
    /**
     * When the field is shown. The repositories and branches are then asked to the
     * forge whenever what the field shows needs them (debounced while typing).
     */
    initialize:
        (params: { helmValuesPath: (string | number)[]; isReadonly: boolean }) =>
        (...args): { fieldId: string; cleanup: () => void } => {
            const { helmValuesPath, isReadonly } = params;

            const [dispatch, getState, rootContext] = args;

            const { evtAction } = rootContext;

            const fieldId = getFieldId(helmValuesPath);

            const value = getGitRepositoryValue(
                (() => {
                    const helmValues = launcher.protectedSelectors.helmValues(getState());

                    assert(helmValues !== null);

                    return getValueAtPath({
                        stringifyableObjectOrArray: helmValues,
                        path: helmValuesPath,
                        doDeleteFromSource: false,
                        doFailOnUnresolved: false
                    });
                })()
            );

            dispatch(
                actions.fieldInitialized({
                    fieldId,
                    fieldState: createFieldState({ helmValuesPath, isReadonly, value })
                })
            );

            const { fieldContextByFieldId } = getContext(rootContext);

            fieldContextByFieldId.set(fieldId, {
                repositories: undefined,
                branches: undefined,
                valueUrl: value.url
            });

            const ctx = Evt.newCtx();

            // NOTE: The forges, the helm values and the field itself all play a part.
            evtAction.attach(ctx, () => dispatch(privateThunks.sync({ fieldId })));

            dispatch(privateThunks.sync({ fieldId }));

            const cleanup = () => {
                ctx.done();

                const fieldContext = fieldContextByFieldId.get(fieldId);

                fieldContext?.repositories?.abort();
                fieldContext?.branches?.abort();

                fieldContextByFieldId.delete(fieldId);

                dispatch(actions.fieldCleanedUp({ fieldId }));
            };

            return { fieldId, cleanup };
        },
    changeMode:
        (params: { fieldId: string; mode: Mode }) =>
        (...args): void => {
            const { fieldId, mode } = params;

            const [dispatch, getState] = args;

            const fieldState = privateSelectors.fieldStateByFieldId(getState())[fieldId];

            assert(fieldState !== undefined);

            dispatch(
                actions.modeChanged({
                    fieldId,
                    mode,
                    urlInput:
                        mode === "url"
                            ? privateSelectors.valueByFieldId(getState())[fieldId].url
                            : fieldState.urlInput
                })
            );
        },
    /** In the Git profile select */
    selectForge:
        (params: { fieldId: string; forgeId: string }) =>
        (...args): void => {
            const { fieldId, forgeId } = params;

            const [dispatch, getState] = args;

            dispatch(actions.forgeSelected({ fieldId, forgeId }));

            const value = privateSelectors.valueByFieldId(getState())[fieldId];

            // NOTE: The repository picked on the previous profile would otherwise be launched.
            if (value.url !== "" && forgeId !== value.forgeId) {
                dispatch(privateThunks.changeValue({ fieldId, value: emptyValue }));
            }
        },
    /** In the search input, while no repository is picked */
    changeSearch:
        (params: { fieldId: string; search: string }) =>
        (...args): void => {
            const { fieldId, search } = params;

            const [dispatch] = args;

            // NOTE: A pasted url, the repository may not be on a connected forge.
            if (/^https?:\/\//.test(search.trim())) {
                dispatch(actions.searchChanged({ fieldId, search: "" }));
                dispatch(thunks.changeUrlInput({ fieldId, urlInput: search }));
                return;
            }

            dispatch(actions.searchChanged({ fieldId, search }));
        },
    /** In the search input, over the picked repository: a new search starts */
    editPickedRepository:
        (params: { fieldId: string; search: string }) =>
        (...args): void => {
            const { fieldId, search } = params;

            const [dispatch] = args;

            dispatch(privateThunks.changeValue({ fieldId, value: emptyValue }));
            dispatch(thunks.changeSearch({ fieldId, search }));
        },
    clearRepository:
        (params: { fieldId: string }) =>
        (...args): void => {
            const { fieldId } = params;

            const [dispatch] = args;

            dispatch(actions.searchChanged({ fieldId, search: "" }));
            dispatch(privateThunks.changeValue({ fieldId, value: emptyValue }));
        },
    pickRepository:
        (params: { fieldId: string; repository: GitRepository }) =>
        (...args): void => {
            const { fieldId, repository } = params;

            const [dispatch, getState] = args;

            const { forgeId } = privateSelectors.fieldByFieldId(getState())[fieldId];

            if (forgeId === undefined) {
                return;
            }

            dispatch(actions.searchChanged({ fieldId, search: "" }));

            dispatch(
                privateThunks.changeValue({
                    fieldId,
                    value: {
                        forgeId,
                        url: repository.httpCloneUrl,
                        branch: repository.defaultBranch ?? ""
                    }
                })
            );
        },
    requestMoreRepositories:
        (params: { fieldId: string }) =>
        (...args): void => {
            const { fieldId } = params;

            const [dispatch, getState] = args;

            const { forgeId, nextPage } =
                privateSelectors.fieldByFieldId(getState())[fieldId];

            const fieldState = privateSelectors.fieldStateByFieldId(getState())[fieldId];

            assert(fieldState !== undefined);

            if (forgeId === undefined || nextPage === undefined) {
                return;
            }

            dispatch(
                actions.moreRepositoriesRequested({
                    fieldId,
                    moreRequest: { forgeId, search: fieldState.search, page: nextPage }
                })
            );
        },
    /** Typing switches to the url mode, the value follows once it is a clone url */
    changeUrlInput:
        (params: { fieldId: string; urlInput: string }) =>
        (...args): void => {
            const { fieldId, urlInput } = params;

            const [dispatch, getState, rootContext] = args;

            const value_new = getValueOfUrlInput({
                urlInput,
                value: privateSelectors.valueByFieldId(getState())[fieldId],
                forges: [
                    // NOTE: A connected forge first, among several on the same url.
                    ...(gitForgesManagement.selectors.connectedForges(getState()) ?? []),
                    // NOTE: Then the others, so that the user is offered to connect it.
                    ...(
                        gitForgesManagement.protectedSelectors.forges(getState()) ?? []
                    ).map(({ config }) => ({ forgeId: config.id, url: config.url }))
                ]
            });

            if (value_new !== undefined) {
                const fieldContext =
                    getContext(rootContext).fieldContextByFieldId.get(fieldId);

                // NOTE: The url input isn't to follow this value, it is where it comes from.
                if (fieldContext !== undefined) {
                    fieldContext.valueUrl = value_new.url;
                }

                dispatch(privateThunks.changeValue({ fieldId, value: value_new }));
            }

            dispatch(
                actions.urlInputChanged({
                    fieldId,
                    urlInput,
                    isTyped: true,
                    forgeId_selected:
                        value_new === undefined || value_new.forgeId === ""
                            ? undefined
                            : value_new.forgeId
                })
            );
        },
    /** Picked in the list, or typed */
    changeBranch:
        (params: { fieldId: string; branch: string }) =>
        (...args): void => {
            const { fieldId, branch } = params;

            const [dispatch, getState] = args;

            const value = privateSelectors.valueByFieldId(getState())[fieldId];

            if (branch === value.branch) {
                return;
            }

            dispatch(privateThunks.changeValue({ fieldId, value: { ...value, branch } }));
        },
    /** What the branches are searched with: "" when the list opens, then what is typed */
    changeBranchSearch:
        (params: { fieldId: string; branchSearch: string }) =>
        (...args): void => {
            const [dispatch] = args;

            dispatch(actions.branchSearchChanged(params));
        }
} satisfies Thunks;

const privateThunks = {
    changeValue:
        (params: { fieldId: string; value: Value }) =>
        (...args): void => {
            const { fieldId, value } = params;

            const [dispatch, getState] = args;

            const fieldState = privateSelectors.fieldStateByFieldId(getState())[fieldId];

            assert(fieldState !== undefined);

            dispatch(
                launcher.thunks.changeFormFieldValue({
                    formFieldValue: {
                        fieldType: "git repository",
                        helmValuesPath: fieldState.helmValuesPath,
                        value
                    },
                    isAutocompleteOptionSelection: false
                })
            );
        },
    /**
     * Makes what the field shows true: the url input follows a value changed elsewhere,
     * the repositories and branches it needs are asked for, the ones it no longer
     * needs are aborted.
     */
    sync:
        (params: { fieldId: string }) =>
        (...args): void => {
            const { fieldId } = params;

            const [dispatch, getState, rootContext] = args;

            const fieldContext =
                getContext(rootContext).fieldContextByFieldId.get(fieldId);

            // NOTE: Cleaned up, or the launcher is no longer ready.
            if (
                fieldContext === undefined ||
                privateSelectors.fieldStateByFieldId(getState())[fieldId] === undefined ||
                launcher.protectedSelectors.helmValues(getState()) === null
            ) {
                return;
            }

            url_input: {
                const value = privateSelectors.valueByFieldId(getState())[fieldId];

                if (value.url === fieldContext.valueUrl) {
                    break url_input;
                }

                fieldContext.valueUrl = value.url;

                const fieldState =
                    privateSelectors.fieldStateByFieldId(getState())[fieldId];

                assert(fieldState !== undefined);

                const urlInput = getUrlInputOfValue({
                    urlInput: fieldState.urlInput,
                    value
                });

                if (urlInput === undefined) {
                    break url_input;
                }

                dispatch(
                    actions.urlInputChanged({
                        fieldId,
                        urlInput,
                        isTyped: false,
                        forgeId_selected: undefined
                    })
                );
            }

            const { repositoriesRequest, branchesRequest } =
                privateSelectors.fieldByFieldId(getState())[fieldId];

            restartRequestIfChanged({
                fieldContext,
                kind: "repositories",
                request:
                    repositoriesRequest === undefined
                        ? undefined
                        : {
                              key: repositoriesRequest.key,
                              start: () =>
                                  dispatch(
                                      privateThunks.searchRepositories({
                                          fieldId,
                                          request: repositoriesRequest.request
                                      })
                                  )
                          }
            });

            restartRequestIfChanged({
                fieldContext,
                kind: "branches",
                request:
                    branchesRequest === undefined
                        ? undefined
                        : {
                              key: branchesRequest.key,
                              start: () =>
                                  dispatch(
                                      privateThunks.listBranches({
                                          fieldId,
                                          request: branchesRequest.request
                                      })
                                  )
                          }
            });

            // NOTE: No repository to list the branches of anymore.
            if (
                branchesRequest === undefined &&
                getState()[name].fieldStateByFieldId[fieldId]?.branches.status !== "idle"
            ) {
                dispatch(
                    actions.branchesChanged({ fieldId, branches: { status: "idle" } })
                );
            }
        },
    /** Returns what aborts it */
    searchRepositories:
        (params: { fieldId: string; request: RepositoriesRequest }) =>
        (...args): (() => void) => {
            const { fieldId, request } = params;
            const { forgeId, cacheKey, search, page, isDebounced } = request;

            const [dispatch] = args;

            const abortController = new AbortController();

            dispatch(actions.repositorySearchStarted({ fieldId }));

            const timer = setTimeout(
                () =>
                    dispatch(
                        gitForgesManagement.thunks.listRepositories({
                            forgeId,
                            search,
                            page,
                            signal: abortController.signal
                        })
                    ).then(
                        ({ repositories, hasNextPage }) =>
                            dispatch(
                                actions.repositorySearchCompleted({
                                    cacheKey,
                                    search,
                                    page,
                                    repositories,
                                    hasNextPage
                                })
                            ),
                        () => {
                            if (!abortController.signal.aborted) {
                                dispatch(
                                    actions.repositorySearchFailed({
                                        fieldId,
                                        forgeId,
                                        search
                                    })
                                );
                            }
                        }
                    ),
                isDebounced ? SEARCH_DEBOUNCE_MS : 0
            );

            return () => {
                clearTimeout(timer);
                abortController.abort();
            };
        },
    /** Returns what aborts it. A failure leaves the list empty: the branch can be typed. */
    listBranches:
        (params: { fieldId: string; request: BranchesRequest }) =>
        (...args): (() => void) => {
            const { fieldId, request } = params;

            const [dispatch] = args;

            const abortController = new AbortController();

            dispatch(
                actions.branchesChanged({ fieldId, branches: { status: "loading" } })
            );

            const timer = setTimeout(
                () =>
                    dispatch(
                        gitForgesManagement.thunks.listBranches({
                            ...request,
                            signal: abortController.signal
                        })
                    ).then(
                        branches => {
                            if (abortController.signal.aborted) {
                                return;
                            }

                            dispatch(
                                actions.branchesChanged({
                                    fieldId,
                                    branches: { status: "loaded", branches }
                                })
                            );
                        },
                        () => {
                            if (abortController.signal.aborted) {
                                return;
                            }

                            dispatch(
                                actions.branchesChanged({
                                    fieldId,
                                    branches: { status: "loaded", branches: [] }
                                })
                            );
                        }
                    ),
                SEARCH_DEBOUNCE_MS
            );

            return () => {
                clearTimeout(timer);
                abortController.abort();
            };
        }
} satisfies Thunks;

/**
 * Aborts the running request of this kind when the key changed, and starts the new
 * one. start returns what aborts it.
 */
function restartRequestIfChanged(params: {
    fieldContext: FieldContext;
    kind: "repositories" | "branches";
    request: { key: string; start: () => () => void } | undefined;
}): void {
    const { fieldContext, kind, request } = params;

    if (fieldContext[kind]?.key === request?.key) {
        return;
    }

    fieldContext[kind]?.abort();
    fieldContext[kind] = undefined;

    if (request === undefined) {
        return;
    }

    // NOTE: Set before starting: the actions it dispatches sync again.
    const running: Request = { key: request.key, abort: () => {} };

    fieldContext[kind] = running;

    const abort = request.start();

    // NOTE: Replaced while it was starting.
    if (fieldContext[kind] !== running) {
        abort();
    }

    running.abort = abort;
}
