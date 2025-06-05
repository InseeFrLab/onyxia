import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { createSelector, createObjectThatThrowsIfAccessed } from "clean-architecture";
import { computeRootForm } from "core/usecases/launcher/decoupledLogic";
import { same } from "evt/tools/inDepth/same";

const state = (rootState: RootState) => {
    const state = rootState[name];

    return state;
};

const isThereThingsToSave = createSelector(state, state => {
    const { values_previous, values } = state;

    return !same(values_previous, values);
});

const values = createSelector(state, state => state.values);

const rootForm = createSelector(
    createSelector(state, state => state.schema),
    values,
    (schema, values) => {
        return computeRootForm({
            chartName: "dummy",
            helmValuesSchema: schema,
            helmValues: values,
            xOnyxiaContext: createObjectThatThrowsIfAccessed(),
            helmDependencies: []
        });
    }
);

const main = createSelector(
    rootForm,
    isThereThingsToSave,
    (rootForm, isThereThingsToSave) => {
        return { rootForm, isThereThingsToSave };
    }
);

export const selectors = { main };

export const protectedSelectors = {
    values
};

export const privateSelectors = {
    rootForm
};
