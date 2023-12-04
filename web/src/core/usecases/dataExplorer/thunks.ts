import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { same } from "evt/tools/inDepth/same";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";

export const thunks = {
    "setQueryParamsAndExtraRestorableStates":
        (params: {
            queryParams: {
                sourceUrl: string;
                rowsPerPage: number;
                page: number;
            };
            extraRestorableStates: {
                selectedRowIndex: number | undefined;
                columnWidths: Record<string, number> | undefined;
            };
        }) =>
        async (...args) => {
            const { queryParams, extraRestorableStates } = params;

            const [dispatch, getState, rootContext] = args;

            const { sqlOlap, s3Client, oidc } = rootContext;

            // NOTE: Preload for minimizing load time when querying.
            sqlOlap.getDb();

            if (
                queryParams.sourceUrl === "" &&
                getState()[name].queryParams !== undefined
            ) {
                await Promise.resolve();
                dispatch(actions.restoreStateNeeded());
                return;
            }

            {
                let pathname: string;

                try {
                    pathname = new URL(queryParams.sourceUrl).pathname;
                } catch {
                    return;
                }

                // capture the extension of the path
                const match = pathname.match(/\.(\w+)$/);

                if (match === null) {
                    return;
                }

                const [, extension] = match;

                if (!["parquet", "csv"].includes(extension)) {
                    dispatch(
                        actions.queryFailed({
                            "errorMessage": `Unsupported file extension: ${extension}`
                        })
                    );

                    return;
                }
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

                if (s3path === sourceUrl) {
                    dispatch(
                        actions.queryFailed({
                            "errorMessage": `Unsupported protocol, only https:// and s3:// are supported`
                        })
                    );
                    await new Promise(() => {});
                }

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
                    "rowCount": rowCountOrErrorMessage
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
