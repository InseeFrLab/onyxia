import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { same } from "evt/tools/inDepth/same";
import { createUsecaseContextApi } from "clean-architecture";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import { assert } from "tsafe/assert";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";

const privateThunks = {
    getFileDonwloadUrl:
        (params: { sourceUrl: string }) =>
        async (...args) => {
            const [dispatch, , { oidc }] = args;

            const { sourceUrl } = params;

            const fileDownloadUrl = await (async () => {
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
            })();

            return fileDownloadUrl;
        },
    performQuery:
        (params: {
            queryParams: {
                sourceUrl: string;
                rowsPerPage: number;
                page: number;
            };
            shouldVerifyUrl: boolean;
        }) =>
        async (...args) => {
            const { queryParams, shouldVerifyUrl } = params;
            const [dispatch, getState, rootContext] = args;

            const coreQueryParams = getState()[name].queryParams;

            const { sourceUrl, page, rowsPerPage } = queryParams;
            const isSourceUrlChanged =
                !coreQueryParams || coreQueryParams.sourceUrl !== sourceUrl;

            dispatch(actions.queryStarted({ queryParams }));

            const { sqlOlap } = rootContext;

            const getIsActive = () => same(getState()[name].queryParams, queryParams);

            dispatch(actions.queryStarted({ queryParams }));

            if (shouldVerifyUrl && !thunks.getIsValidSourceUrl({ sourceUrl })()) {
                dispatch(actions.queryFailed({ errorMessage: "Invalid sourceUrl" }));
                return;
            }

            const { fileDownloadUrl, rowCountOrErrorMessage } = await (async () => {
                if (!isSourceUrlChanged) {
                    const data = getState()[name].data;
                    assert(data !== undefined);
                    return {
                        fileDownloadUrl: data.fileDownloadUrl,
                        rowCountOrErrorMessage: data.rowCount
                    };
                }

                const fileDownloadUrl = await dispatch(
                    privateThunks.getFileDonwloadUrl({
                        sourceUrl
                    })
                );

                const rowCountOrErrorMessage = await sqlOlap
                    .getRowCount(sourceUrl)
                    .catch(error => String(error));

                return { fileDownloadUrl, rowCountOrErrorMessage };
            })();

            if (typeof rowCountOrErrorMessage === "string") {
                dispatch(
                    actions.queryFailed({
                        errorMessage: rowCountOrErrorMessage
                    })
                );

                return;
            }

            const rowCount = rowCountOrErrorMessage;

            if (!getIsActive()) {
                return;
            }

            const rowsOrErrorMessage = await sqlOlap
                .getRows({
                    sourceUrl,
                    rowsPerPage: rowsPerPage + 1,
                    page
                })
                .catch(error => String(error));

            if (typeof rowsOrErrorMessage === "string") {
                dispatch(actions.queryFailed({ errorMessage: rowsOrErrorMessage }));
                return;
            }

            const rows = rowsOrErrorMessage;
            const hasMore = rows.length === rowsPerPage + 1;

            dispatch(
                actions.querySucceeded({
                    rows: hasMore ? rows.slice(0, -1) : rows,
                    rowCount:
                        rowCount !== undefined
                            ? rowCount
                            : hasMore
                              ? undefined
                              : queryParams.rowsPerPage * (queryParams.page - 1) +
                                rows.length,
                    fileDownloadUrl
                })
            );
        },
    detectFileType:
        (params: { sourceUrl: string }) =>
        async (...args) => {
            const { sourceUrl } = params;
            const [dispatch] = args;

            const extension = (() => {
                const validExtensions = ["parquet", "csv", "json"] as const;
                type ValidExtension = (typeof validExtensions)[number];

                const isValidExtension = (ext: string): ext is ValidExtension =>
                    validExtensions.includes(ext as ValidExtension);

                let pathname: string;

                try {
                    pathname = new URL(sourceUrl).pathname;
                } catch {
                    return undefined;
                }
                const match = pathname.match(/\.(\w+)$/);

                if (match === null) {
                    return undefined;
                }

                const [, extension] = match;

                return isValidExtension(extension) ? extension : undefined;
            })();

            if (extension) {
                return extension;
            }

            const contentType = await (async () => {
                const fileDownloadUrl = await dispatch(
                    privateThunks.getFileDonwloadUrl({
                        sourceUrl
                    })
                );
            })();
        }
} satisfies Thunks;

export const thunks = {
    initialize:
        (params: {
            sourceUrl: string;
            rowsPerPage: number;
            page: number;
            selectedRowIndex: number | undefined;
            columnVisibility: Record<string, boolean>;
        }) =>
        async (...args) => {
            const { sourceUrl, columnVisibility, page, rowsPerPage, selectedRowIndex } =
                params;
            const [dispatch, getState, rootContext] = args;

            const { sqlOlap } = rootContext;

            sqlOlap.getConfiguredAsyncDuckDb();

            if (sourceUrl === "") {
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
                thunks.updateDataSource({
                    queryParams: { sourceUrl, rowsPerPage, page },
                    shouldVerifyUrl: true
                })
            );
        },
    getIsValidSourceUrl: (params: { sourceUrl: string }) => () => {
        const { sourceUrl } = params;

        if (sourceUrl == "") {
            return true;
        }
        {
            let pathname: string;

            try {
                pathname = new URL(sourceUrl).pathname;
            } catch {
                return false;
            }

            // capture the extension of the path
            const match = pathname.match(/\.(\w+)$/);

            if (match === null) {
                return false;
            }

            const [, extension] = match;

            if (!["parquet", "csv", "json"].includes(extension)) {
                return false;
            }
        }

        if (!sourceUrl.startsWith("s3://") && !sourceUrl.startsWith("https://")) {
            return false;
        }

        return true;
    },
    updateDataSource:
        (params: {
            queryParams: {
                sourceUrl: string;
                rowsPerPage: number;
                page: number;
            };
            shouldVerifyUrl: boolean;
        }) =>
        async (...args) => {
            const { queryParams, shouldVerifyUrl } = params;

            const [dispatch, getState, rootContext] = args;

            if (queryParams.sourceUrl === "") {
                if (getState()[name].queryParams !== undefined) {
                    dispatch(actions.restoreState());
                }
                return;
            }
            if (getState()[name].isQuerying) {
                dispatch(actions.queryCanceled());
            }

            const { sourceUrl } = queryParams;

            if (getState()[name].queryParams?.sourceUrl === sourceUrl) {
                return;
            }

            const { waitForDebounce } = getContext(rootContext);

            await waitForDebounce();

            dispatch(privateThunks.performQuery({ queryParams, shouldVerifyUrl }));
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
                    queryParams: { ...stateQueryParams, page, rowsPerPage },
                    shouldVerifyUrl: false
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
