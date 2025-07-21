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
    const { userProfile_previous, userProfile } = state;

    return !same(userProfile_previous, userProfile);
});

const rootForm = createSelector(
    createSelector(state, state => state.schema),
    createSelector(state, state => state.userProfile.userProfileValues),
    createSelector(
        createSelector(state, state => state.userProfile.autoInjectionDisabledFields),
        autoInjectionDisabledFields =>
            autoInjectionDisabledFields.map(({ valuesPath }) => ({
                helmValuesPath: valuesPath
            }))
    ),
    (schema, userProfileValues, autoInjectionDisabledFields) => {
        return computeRootForm({
            chartName: "dummy",
            helmValuesSchema: schema,
            helmValues: userProfileValues,
            xOnyxiaContext: createObjectThatThrowsIfAccessed(),
            helmDependencies: [],
            autoInjectionDisabledFields
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
    userProfile: createSelector(state, state => state.userProfile)
};

export const privateSelectors = {
    rootForm
};
