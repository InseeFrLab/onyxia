import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { fetchCatalogAndConvertInDatasets } from "./decoupledLogic/jsonld";

export const thunks = {
    initialize:
        (params: {
            sourceUrl: string | undefined;
            rowsPerPage: number | undefined;
            page: number | undefined;
        }) =>
        async (...args) => {
            const { sourceUrl, page, rowsPerPage } = params;

            const [dispatch] = args;

            if (sourceUrl === undefined) {
                return;
            }

            dispatch(thunks.updateSourceUrl({ sourceUrl }));
        },
    updateSourceUrl:
        (params: { sourceUrl: string }) =>
        async (...args) => {
            const { sourceUrl } = params;

            const [dispatch, getState] = args;

            if (sourceUrl === "") {
                dispatch(actions.restoreState());
                return;
            }

            const state = getState()[name];

            const isSameSourceUrl =
                state.queryParams && state.queryParams.sourceUrl === sourceUrl;

            if (isSameSourceUrl) {
                return;
            }

            if (state.isQuerying) {
                dispatch(actions.queryCanceled());
            }

            dispatch(
                actions.queryStarted({
                    queryParams: { sourceUrl, page: undefined, rowsPerPage: undefined }
                })
            );

            let datasets;

            try {
                datasets = await fetchCatalogAndConvertInDatasets(sourceUrl);
            } catch (error) {
                console.error("Erreur JSON-LD :", error);
                dispatch(actions.queryFailed({ error: String(error) }));
                return;
            }

            dispatch(actions.querySucceeded({ datasets }));
        }
} satisfies Thunks;
