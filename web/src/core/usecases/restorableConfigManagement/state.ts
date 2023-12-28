import { type FormFieldValue } from "core/usecases/launcher/FormField";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";

export type State = {
    chartIconUrlByChartNameAndCatalogId: State.ChartIconUrlByChartNameAndCatalogId;
};

export namespace State {
    export type ChartIconUrlByChartNameAndCatalogId = {
        [catalogId: string]: { [chartName: string]: string | undefined };
    };
}

export type RestorableConfig = {
    catalogId: string;
    chartName: string;
    chartVersion: string;
    formFieldsValueDifferentFromDefault: FormFieldValue[];
};

export const name = "restorableConfigManagement";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>({
        "debugMessage": [
            "The restorableConfigState should have been",
            "initialized during the store initialization"
        ].join(" ")
    }),
    "reducers": {
        "chartIconsFetched": (
            state,
            {
                payload
            }: {
                payload: {
                    chartIconUrlByChartNameAndCatalogId: State.ChartIconUrlByChartNameAndCatalogId;
                };
            }
        ) => {
            const { chartIconUrlByChartNameAndCatalogId } = payload;

            state.chartIconUrlByChartNameAndCatalogId =
                chartIconUrlByChartNameAndCatalogId;
        }
    }
});
