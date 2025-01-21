import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { same } from "evt/tools/inDepth/same";
import { createUsecaseContextApi } from "clean-architecture";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import { assert } from "tsafe/assert";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import { inferFileType } from "./decoupledLogic/inferFileType";
import type { SupportedFileType } from "./decoupledLogic/SupportedFileType";
import memoize from "memoizee";

const privateThunks = {
    getFileDownloadUrl:
        (params: { sourceUrl: string }) =>
        async (...args) => {
            const [dispatch, , { oidc }] = args;

            const { sourceUrl } = params;

            if (sourceUrl.startsWith("https://")) {
                return sourceUrl;
            }

            const s3path = sourceUrl.replace(/^s3:\/\//, "/");
            assert(s3path !== sourceUrl, "Unsupported protocol");

            if (!oidc.isUserLoggedIn) {
                oidc.login({ doesCurrentHrefRequiresAuth: true });
                await new Promise(() => {});
            }

            const s3Client = (
                await dispatch(
                    s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
                )
            )?.s3Client;

            if (s3Client === undefined) {
                alert("No S3 client available");
                await new Promise<never>(() => {});
                assert(false);
            }

            return s3Client.getFileDownloadUrl({
                path: s3path,
                validityDurationSecond: 3600 * 6
            });
        },
    performQuery:
        (params: {
            queryParams: {
                sourceUrl: string;
                rowsPerPage: number;
                page: number;
            };
        }) =>
        async (...args) => {
            const { queryParams } = params;
            const [dispatch, getState, rootContext] = args;

            const coreQueryParams = getState()[name].queryParams;

            const { sourceUrl, page, rowsPerPage } = queryParams;
            const isSourceUrlChanged =
                !coreQueryParams || coreQueryParams.sourceUrl !== sourceUrl;

            dispatch(actions.queryStarted({ queryParams }));

            const { sqlOlap } = rootContext;

            const getIsActive = () => same(getState()[name].queryParams, queryParams);

            dispatch(actions.queryStarted({ queryParams }));

            const { data } = getState()[name];

            const result = await dispatch(
                privateThunks.inferFileTypeAndGetDirectFileDownloadUrl({ sourceUrl })
            );

            if (result.outcome === "error") {
                dispatch(
                    actions.queryFailed({
                        error: {
                            isWellKnown: true,
                            kind: result.reason
                        }
                    })
                );
                return;
            }

            const { fileDownloadUrl_direct, fileType } = result;

            const rowCountOrErrorMessage = await (async () => {
                if (!isSourceUrlChanged) {
                    assert(data !== undefined);
                    return data.rowCount;
                }

                const rowCountOrErrorMessage = await sqlOlap
                    .getRowCount({ sourceUrl, fileType })
                    .catch(error => String(error));

                return rowCountOrErrorMessage;
            })();

            if (typeof rowCountOrErrorMessage === "string") {
                dispatch(
                    actions.queryFailed({
                        error: {
                            isWellKnown: false,
                            message: rowCountOrErrorMessage
                        }
                    })
                );

                return;
            }

            const rowCount = rowCountOrErrorMessage;

            if (!getIsActive()) {
                return;
            }
            const rowsAndColumnsOrErrorMessage = await sqlOlap
                .getRows({
                    sourceUrl: sourceUrl.startsWith("s3://")
                        ? sourceUrl
                        : fileDownloadUrl_direct,
                    rowsPerPage: rowsPerPage + 1,
                    page,
                    fileType
                })
                .catch(error => {
                    console.error("Failed to fetch rows:", error);
                    return String(error);
                });

            if (typeof rowsAndColumnsOrErrorMessage === "string") {
                dispatch(
                    actions.queryFailed({
                        error: {
                            isWellKnown: false,
                            message: rowsAndColumnsOrErrorMessage
                        }
                    })
                );
                return;
            }

            const { columns, rows } = rowsAndColumnsOrErrorMessage;
            const hasMore = rows.length === rowsPerPage + 1;

            dispatch(
                actions.querySucceeded({
                    rows: hasMore ? rows.slice(0, -1) : rows,
                    columns,
                    rowCount:
                        rowCount !== undefined
                            ? rowCount
                            : hasMore
                              ? undefined
                              : queryParams.rowsPerPage * (queryParams.page - 1) +
                                rows.length,
                    fileDownloadUrl: fileDownloadUrl_direct,
                    fileType
                })
            );
        },
    inferFileTypeAndGetDirectFileDownloadUrl:
        (params: { sourceUrl: string }) =>
        async (
            ...args
        ): Promise<
            | { outcome: "error"; reason: "unsupported file type" | "can't fetch file" }
            | {
                  outcome: "success";
                  fileType: SupportedFileType;
                  fileDownloadUrl_direct: string;
              }
        > => {
            const { sourceUrl } = params;
            const [dispatch] = args;

            const partialFetch = memoize(
                async () => {
                    const fileDownloadUrl = await dispatch(
                        privateThunks.getFileDownloadUrl({ sourceUrl })
                    );

                    const responseOrError = await fetch(fileDownloadUrl, {
                        method: "GET",
                        headers: { Range: "bytes=0-15" } // Fetch the first 16 bytes
                    }).catch(error => error as Error);

                    if (responseOrError instanceof Error) {
                        return undefined;
                    }

                    const response = responseOrError;

                    if (!response.ok) {
                        return undefined;
                    }

                    return {
                        response,
                        fileDownloadUrl_direct: response.url
                    };
                },
                { promise: true }
            );

            const fileType = await inferFileType({
                sourceUrl,
                getContentType: async () => {
                    const result = await partialFetch();

                    if (result === undefined) {
                        return null;
                    }

                    const { response } = result;

                    return response.headers.get("Content-Type");
                },
                getFirstBytes: async () => {
                    const result = await partialFetch();

                    if (result === undefined) {
                        return undefined;
                    }

                    const { response } = result;

                    return response.arrayBuffer();
                }
            });

            const result = await partialFetch();

            if (result === undefined) {
                return { outcome: "error", reason: "can't fetch file" };
            }

            if (fileType === undefined) {
                return { outcome: "error", reason: "unsupported file type" };
            }

            const { fileDownloadUrl_direct } = result;

            return {
                outcome: "success",
                fileType,
                fileDownloadUrl_direct
            };
        },
    updateDataSource:
        (params: {
            queryParams: {
                sourceUrl: string;
                rowsPerPage: number | undefined;
                page: number | undefined;
            };
        }) =>
        async (...args) => {
            const {
                queryParams: { sourceUrl, rowsPerPage = 25, page = 1 }
            } = params;

            const [dispatch, getState, rootContext] = args;

            if (sourceUrl === "") {
                if (getState()[name].queryParams !== undefined) {
                    dispatch(actions.restoreState());
                }
                return;
            }
            if (getState()[name].isQuerying) {
                dispatch(actions.queryCanceled());
            }

            if (getState()[name].queryParams?.sourceUrl === sourceUrl) {
                return;
            }

            const { waitForDebounce } = getContext(rootContext);

            await waitForDebounce();

            dispatch(
                privateThunks.performQuery({
                    queryParams: {
                        sourceUrl,
                        rowsPerPage,
                        page
                    }
                })
            );
        }
} satisfies Thunks;

export const thunks = {
    initialize:
        (params: {
            sourceUrl: string | undefined;
            rowsPerPage: number | undefined;
            page: number | undefined;
            selectedRowIndex: number | undefined;
            columnVisibility: Record<string, boolean> | undefined;
        }) =>
        async (...args) => {
            const {
                sourceUrl,
                columnVisibility = {},
                page,
                rowsPerPage,
                selectedRowIndex
            } = params;
            const [dispatch, getState, rootContext] = args;

            const { sqlOlap } = rootContext;

            sqlOlap.getConfiguredAsyncDuckDb();

            if (sourceUrl === undefined) {
                return;
            }

            dispatch(
                actions.extraRestorableStateSet({
                    extraRestorableStates: { columnVisibility, selectedRowIndex }
                })
            );

            if (same(getState()[name].queryParams, { sourceUrl, rowsPerPage, page })) {
                return;
            }

            const { waitForDebounce } = getContext(rootContext);

            await waitForDebounce();

            await dispatch(
                privateThunks.updateDataSource({
                    queryParams: { sourceUrl, rowsPerPage, page }
                })
            );
        },
    getIsValidSourceUrl: (params: { sourceUrl: string }) => () => {
        const { sourceUrl } = params;

        if (!sourceUrl.startsWith("s3://") && !sourceUrl.startsWith("https://")) {
            return false;
        }

        return true;
    },
    updateDataSource:
        (params: { sourceUrl: string }) =>
        async (...args) => {
            const { sourceUrl } = params;

            const [dispatch] = args;

            await dispatch(
                privateThunks.updateDataSource({
                    queryParams: {
                        sourceUrl,
                        rowsPerPage: undefined,
                        page: undefined
                    }
                })
            );
        },
    updatePaginationModel:
        (params: { rowsPerPage: number; page: number }) =>
        (...args) => {
            const { rowsPerPage, page } = params;
            const [dispatch, getState] = args;
            const stateQueryParams = getState()[name].queryParams;
            assert(stateQueryParams !== undefined);

            dispatch(
                privateThunks.performQuery({
                    queryParams: { ...stateQueryParams, page, rowsPerPage }
                })
            );
        },
    updateColumnVisibility:
        (params: { columnVisibility: Record<string, boolean> }) =>
        (...args) => {
            const { columnVisibility } = params;
            const [dispatch, ,] = args;
            dispatch(actions.columnVisibilitySet({ columnVisibility }));
        },
    updateRowSelected:
        (params: { selectedRowIndex: number }) =>
        (...args) => {
            const { selectedRowIndex } = params;
            const [dispatch, ,] = args;
            dispatch(actions.selectedRowIndexSet({ selectedRowIndex }));
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => {
    const { waitForDebounce } = waitForDebounceFactory({ delay: 200 });

    return {
        waitForDebounce
    };
});
