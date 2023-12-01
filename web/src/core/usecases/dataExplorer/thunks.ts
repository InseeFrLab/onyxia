import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { same } from "evt/tools/inDepth/same";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";

export const thunks = {
    "setQueryParams":
        (params: { sourceUrl: string; rowsPerPage: number; page: number }) =>
        async (...args) => {
            const { sourceUrl, rowsPerPage, page } = params;

            const [dispatch, getState, rootContext] = args;

            const { sqlOlap, s3Client } = rootContext;

            // NOTE: Preload for minimizing load time when querying.
            sqlOlap.getDb();

            const queryParams = { sourceUrl, rowsPerPage, page };

            if (same(getState()[name].queryParams, queryParams)) {
                return;
            }

            const { waitForDebounce } = getContext(rootContext);

            await waitForDebounce();

            dispatch(actions.queryStarted({ queryParams }));

            const getIsActive = () => same(getState()[name].queryParams, queryParams);

            const httpsUrl = await (() => {
                if (sourceUrl.startsWith("https://")) {
                    return sourceUrl;
                }

                const s3path = sourceUrl.replace(/^s3:\/\//, "/");

                if (s3path === sourceUrl) {
                    throw new Error("Only https:// and s3:// urls are supported");
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
                .getRows({ "sourceUrl": httpsUrl, rowsPerPage, page })
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
