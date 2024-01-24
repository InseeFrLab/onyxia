import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";

export type State = {
    chartIconUrlByChartNameAndCatalogId: {
        [catalogId: string]: { [chartName: string]: string | undefined };
    };
};

export const name = "restorableConfigManagement";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": id<State>({
        "chartIconUrlByChartNameAndCatalogId": {}
    }),
    "reducers": {
        "initialized": (
            state,
            {
                payload
            }: {
                payload: {
                    chartIconUrlByChartNameAndCatalogId: State["chartIconUrlByChartNameAndCatalogId"];
                };
            }
        ) => {
            const { chartIconUrlByChartNameAndCatalogId } = payload;

            state.chartIconUrlByChartNameAndCatalogId =
                chartIconUrlByChartNameAndCatalogId;
        }
    }
});
