import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { same } from "evt/tools/inDepth/same";
import { createUsecaseContextApi } from "clean-architecture";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import { assert } from "tsafe/assert";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";

export const thunks = {
    getIsValidSourceUrl: (params: { sourceUrl: string }) => () => {
        const { sourceUrl } = params;

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

            if (!["parquet", "csv"].includes(extension)) {
                return false;
            }
        }

        if (!sourceUrl.startsWith("s3://") && !sourceUrl.startsWith("https://")) {
            return false;
        }

        return true;
    },
    setQueryParamsAndExtraRestorableStates:
        (params: {
            queryParams: {
                sourceUrl: string;
                rowsPerPage: number;
                page: number;
            };
            extraRestorableStates: {
                selectedRowIndex: number | undefined;
                columnVisibility: Record<string, boolean>;
            };
        }) =>
        async (...args) => {
            const { queryParams, extraRestorableStates } = params;

            const [dispatch, getState, rootContext] = args;

            const { sqlOlap, oidc } = rootContext;

            // NOTE: Preload for minimizing load time when querying.
            sqlOlap.getConfiguredAsyncDuckDb();

            if (queryParams.sourceUrl === "") {
                if (getState()[name].queryParams !== undefined) {
                    await Promise.resolve();
                    dispatch(actions.restoreStateNeeded());
                }
                return;
            }

            dispatch(actions.extraRestorableStateSet({ extraRestorableStates }));

            if (same(getState()[name].queryParams, queryParams)) {
                return;
            }

            const { waitForDebounce } = getContext(rootContext);

            await waitForDebounce();

            dispatch(actions.queryStarted({ queryParams }));

            const getIsActive = () => same(getState()[name].queryParams, queryParams);

            const { sourceUrl } = queryParams;

            const fileDownloadUrl = await (async () => {
                if (sourceUrl.startsWith("https://")) {
                    return sourceUrl;
                }

                const s3path = sourceUrl.replace(/^s3:\/\//, "/");

                assert(s3path !== sourceUrl, "Unsupported protocol");

                if (!oidc.isUserLoggedIn) {
                    oidc.login({
                        doesCurrentHrefRequiresAuth: true
                    });
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

            const rowCountOrErrorMessage = await sqlOlap
                .getRowCount(sourceUrl)
                .catch(error => String(error));

            if (!getIsActive()) {
                //An other query has been made in the meantime
                return;
            }

            if (typeof rowCountOrErrorMessage === "string") {
                dispatch(
                    actions.queryFailed({
                        errorMessage: rowCountOrErrorMessage
                    })
                );

                return;
            }

            const rowCount = rowCountOrErrorMessage;

            const rowsOrErrorMessage = await sqlOlap
                .getRows({
                    sourceUrl,
                    rowsPerPage: queryParams.rowsPerPage + 1,
                    page: queryParams.page
                })
                .catch(error => String(error));

            if (!getIsActive()) {
                //An other query has been made in the meantime
                return;
            }

            if (typeof rowsOrErrorMessage === "string") {
                dispatch(
                    actions.queryFailed({
                        errorMessage: rowsOrErrorMessage
                    })
                );

                return;
            }

            const rows = rowsOrErrorMessage;

            const hasMore = rows.length === queryParams.rowsPerPage + 1;

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
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => {
    const { waitForDebounce } = waitForDebounceFactory({
        delay: 200
    });

    return {
        waitForDebounce
    };
});
