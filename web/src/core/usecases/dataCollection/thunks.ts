import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { fetchCatalogDocuments } from "./decoupledLogic/jsonld";

export const thunks = {
    initialize:
        (params: { sourceUrl: string | undefined }) =>
        async (...args) => {
            const { sourceUrl } = params;

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

            try {
                const { framedCatalog } = await fetchCatalogDocuments(sourceUrl);

                dispatch(actions.querySucceeded({ framedCatalog }));
            } catch (error) {
                dispatch(actions.queryFailed({ errors: [String(error)] }));
                return;
            }
        }
} satisfies Thunks;
