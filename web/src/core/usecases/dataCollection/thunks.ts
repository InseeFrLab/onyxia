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

            console.log(sourceUrl);
            const [dispatch, getState] = args;

            if (sourceUrl === "") {
                dispatch(actions.restoreState());
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

            try {
                const datasets = await fetchCatalogAndConvertInDatasets(sourceUrl);

                dispatch(actions.querySucceeded({ datasets }));
            } catch (error) {
                console.error("Erreur JSON-LD :", error);
                dispatch(actions.queryFailed({ error: String(error) }));
            }
        }
} satisfies Thunks;
