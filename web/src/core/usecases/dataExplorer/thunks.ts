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

            const data = getState()[name].data;

            const { fileType, fileDownloadUrl: fileDownloadUrlOrUndefined } =
                await (async () => {
                    if (!isSourceUrlChanged && data.state !== "empty") {
                        return {
                            fileType: data.fileType,
                            fileDownloadUrl: data.fileDownloadUrl
                        };
                    }
                    return dispatch(privateThunks.detectFileType({ sourceUrl }));
                })();

            if (fileType === undefined) {
                dispatch(
                    actions.queryFailed({
                        //TODO Improve
                        errorMessage:
                            "Unable to detect the file type, we support only parquet, csv and json."
                    })
                );
                return;
            }

            const fileDownloadUrl =
                fileDownloadUrlOrUndefined ??
                (await dispatch(
                    privateThunks.getFileDonwloadUrl({
                        sourceUrl
                    })
                ));

            const rowCountOrErrorMessage = await (async () => {
                if (!isSourceUrlChanged) {
                    assert(data.state === "loaded");
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
                .getRowsAndColumns({
                    sourceUrl,
                    rowsPerPage: rowsPerPage + 1,
                    page,
                    fileType
                })
                .catch(error => {
                    console.error(error);
                    return String(error);
                });

            if (typeof rowsOrErrorMessage === "string") {
                dispatch(actions.queryFailed({ errorMessage: rowsOrErrorMessage }));
                return;
            }

            const { columns, rows } = rowsOrErrorMessage;
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
                    fileDownloadUrl,
                    fileType
                })
            );
        },
    detectFileType:
        (params: { sourceUrl: string }) =>
        async (...args) => {
            const { sourceUrl } = params;
            const [dispatch] = args;

            const validFileType = ["parquet", "csv", "json"] as const;
            type ValidFileType = (typeof validFileType)[number];

            const isValidFileType = (ext: string): ext is ValidFileType =>
                validFileType.includes(ext as ValidFileType);

            const extension = (() => {
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

                return isValidFileType(extension) ? extension : undefined;
            })();

            if (extension) {
                return { fileType: extension, fileDownloadUrl: undefined };
            }

            const fileDownloadUrl = await dispatch(
                privateThunks.getFileDonwloadUrl({ sourceUrl })
            );

            try {
                const response = await fetch(fileDownloadUrl, {
                    method: "GET",
                    headers: { Range: "bytes=0-15" } // Fetch the first 16 bytes
                });

                if (!response.ok) {
                    return { fileType: undefined, fileDownloadUrl };
                }

                //Regarder l'extension de l'url redirigé

                if (response.url !== fileDownloadUrl) {
                    //TODO Display something to user
                    console.log(
                        "The url you provided is being redirected to another url"
                    );
                }

                const contentType = response.headers.get("Content-Type");

                const filTypeExtractdByContentType = (() => {
                    if (!contentType) {
                        return undefined;
                    }

                    //Maybe it could be interesting to reject some content types and stop the detection
                    const contentTypeToExtension = [
                        {
                            keyword: "application/parquet" as const,
                            extension: "parquet" as const
                        },
                        {
                            keyword: "application/x-parquet" as const,
                            extension: "parquet" as const
                        },
                        { keyword: "text/csv" as const, extension: "csv" as const },
                        {
                            keyword: "application/csv" as const,
                            extension: "csv" as const
                        },
                        {
                            keyword: "application/json" as const,
                            extension: "json" as const
                        },
                        { keyword: "text/json" as const, extension: "json" as const }
                    ];

                    const match = contentTypeToExtension.find(
                        ({ keyword }) => contentType === keyword
                    );
                    return match ? match.extension : undefined;
                })();

                if (filTypeExtractdByContentType !== undefined) {
                    return {
                        fileType: filTypeExtractdByContentType,
                        fileDownloadUrl: response.url
                    };
                }

                const fileSignatures = [
                    {
                        condition: (bytes: Uint8Array) =>
                            bytes[0] === 80 &&
                            bytes[1] === 65 &&
                            bytes[2] === 82 &&
                            bytes[3] === 49, // "PAR1"
                        extension: "parquet" as const
                    },
                    {
                        condition: (bytes: Uint8Array) => [91, 123].includes(bytes[0]), // "[" or "{"
                        extension: "json" as const // JSON
                    },
                    {
                        condition: (bytes: Uint8Array) => {
                            const fileContent = new TextDecoder().decode(bytes);
                            return (
                                fileContent.includes(",") ||
                                fileContent.includes("|") ||
                                fileContent.includes(";") ||
                                fileContent.includes("\t")
                            ); // CSV heuristic
                        },
                        extension: "csv" as const
                    }
                ];

                const arrayBuffer = await response.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);

                const match = fileSignatures.find(({ condition }) => condition(bytes));

                if (match) {
                    return { fileType: match.extension, fileDownloadUrl: response.url };
                }
            } catch (error) {
                console.error("Failed to fetch file for type detection:", error);
                //TODO: reject an error
                return { fileType: undefined, fileDownloadUrl };
            }

            //Ask user to manualy specify the file type
            return { fileType: undefined, fileDownloadUrl };
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
