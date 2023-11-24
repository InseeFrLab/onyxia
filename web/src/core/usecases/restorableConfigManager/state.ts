import { type FormFieldValue } from "core/usecases/launcher/FormField";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";

type State = {
    restorableConfigs: RestorableConfig[];
    chartIconUrlByChartNameAndCatalogId: ChartIconUrlByChartNameAndCatalogId | undefined;
};

export type ChartIconUrlByChartNameAndCatalogId = {
    [catalogId: string]: { [chartName: string]: string | undefined };
};

export type RestorableConfig = {
    catalogId: string;
    chartName: string;
    chartVersion: string;
    formFieldsValueDifferentFromDefault: FormFieldValue[];
};

export const name = "restorableConfigManager";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>({
        "debugMessage": [
            "The restorableConfigState should have been",
            "initialized during the store initialization"
        ].join(" ")
    }),
    "reducers": {
        "initializationCompleted": (
            _,
            {
                payload
            }: {
                payload: {
                    restorableConfigs: RestorableConfig[];
                };
            }
        ) => {
            const { restorableConfigs } = payload;
            return {
                restorableConfigs,
                "chartIconUrlByChartNameAndCatalogId": undefined
            };
        },
        "chartIconsFetched": (
            state,
            {
                payload
            }: {
                payload: {
                    chartIconUrlByChartNameAndCatalogId: ChartIconUrlByChartNameAndCatalogId;
                };
            }
        ) => {
            const { chartIconUrlByChartNameAndCatalogId } = payload;

            state.chartIconUrlByChartNameAndCatalogId =
                chartIconUrlByChartNameAndCatalogId;
        },
        "restorableConfigsUpdated": (
            state,
            {
                payload
            }: {
                payload: {
                    restorableConfigs: RestorableConfig[];
                };
            }
        ) => {
            const { restorableConfigs } = payload;

            state.restorableConfigs = restorableConfigs;
        }
    }
});
