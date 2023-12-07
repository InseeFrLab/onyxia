import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { same } from "evt/tools/inDepth/same";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import { assert } from "tsafe/assert";

export const thunks = {
    "getIsValidSourceUrl": (params: { sourceUrl: string }) => () => {
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
    "setQueryParamsAndExtraRestorableStates":
        (params: {
            queryParams: {
                sourceUrl: string;
                rowsPerPage: number;
                page: number;
            };
            extraRestorableStates: {
                selectedRowIndex: number | undefined;
                columnWidths: Record<string, number>;
                columnVisibility: Record<string, boolean>;
            };
        }) =>
        async (...args) => {
            const { queryParams, extraRestorableStates } = params;

            const [dispatch, getState, rootContext] = args;

            const { sqlOlap, s3Client, oidc } = rootContext;

            // NOTE: Preload for minimizing load time when querying.
            sqlOlap.getDb();

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

            const httpsUrl = await (async () => {
                const { sourceUrl } = queryParams;

                if (sourceUrl.startsWith("https://")) {
                    return sourceUrl;
                }

                const s3path = sourceUrl.replace(/^s3:\/\//, "/");

                assert(s3path !== sourceUrl, "Unsupported protocol");

                if (!oidc.isUserLoggedIn) {
                    oidc.login({
                        "doesCurrentHrefRequiresAuth": true
                    });
                    await new Promise(() => {});
                }

                return s3Client.getFileDownloadUrl({ "path": s3path });
            })();

            const rowCountOrErrorMessage = await sqlOlap
                .getRowCount(httpsUrl)
                .catch(error => String(error));

            if (!getIsActive()) {
                //An other query has been made in the meantime
                return;
            }

            if (typeof rowCountOrErrorMessage === "string") {
                dispatch(
                    actions.queryFailed({
                        "errorMessage": rowCountOrErrorMessage
                    })
                );

                return;
            }

            const rowsOrErrorMessage = await sqlOlap
                .getRows({
                    "sourceUrl": httpsUrl,
                    "rowsPerPage": queryParams.rowsPerPage,
                    "page": queryParams.page
                })
                .catch(error => String(error));

            if (!getIsActive()) {
                //An other query has been made in the meantime
                return;
            }

            if (typeof rowsOrErrorMessage === "string") {
                dispatch(
                    actions.queryFailed({
                        "errorMessage": rowsOrErrorMessage
                    })
                );

                return;
            }

            dispatch(
                actions.querySucceeded({
                    "rows": rowsOrErrorMessage,
                    "rowCount": rowCountOrErrorMessage ?? 99999999,
                    "fileDownloadUrl": httpsUrl
                })
            );
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => {
    const { waitForDebounce } = waitForDebounceFactory({
        "delay": 200
    });

    return {
        waitForDebounce
    };
});
