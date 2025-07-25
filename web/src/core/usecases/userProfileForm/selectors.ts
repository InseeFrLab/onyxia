import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { createSelector, createObjectThatThrowsIfAccessed } from "clean-architecture";
import { computeRootForm } from "core/usecases/launcher/decoupledLogic";
import { same } from "evt/tools/inDepth/same";
import { structuredCloneButFunctions } from "core/tools/structuredCloneButFunctions";
import {
    type Stringifyable,
    getValueAtPath,
    assignValueAtPath
} from "core/tools/Stringifyable";

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
            autoInjectionDisabledFields,
            autocompleteOptions: undefined
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

const userProfile = createSelector(state, state => state.userProfile);

const userProfileValues_splittedByAutoInjection = createSelector(
    userProfile,
    userProfile => {
        const { userProfileValues, autoInjectionDisabledFields } = userProfile;

        const userProfileValues_autoInjected =
            structuredCloneButFunctions(userProfileValues);
        const userProfileValues_nonAutoInjected: Record<string, Stringifyable> = {};

        for (const { valuesPath } of autoInjectionDisabledFields) {
            const value = getValueAtPath({
                stringifyableObjectOrArray: userProfileValues_autoInjected,
                path: valuesPath,
                doFailOnUnresolved: true,
                doDeleteFromSource: true
            });

            assignValueAtPath({
                stringifyableObjectOrArray: userProfileValues_nonAutoInjected,
                path: valuesPath,
                value: value
            });
        }

        return { userProfileValues_autoInjected, userProfileValues_nonAutoInjected };
    }
);

export const protectedSelectors = {
    userProfileValues_autoInjected: createSelector(
        userProfileValues_splittedByAutoInjection,
        ({ userProfileValues_autoInjected }) => userProfileValues_autoInjected
    ),
    userProfileValues_nonAutoInjected: createSelector(
        userProfileValues_splittedByAutoInjection,
        ({ userProfileValues_nonAutoInjected }) => userProfileValues_nonAutoInjected
    )
};

export const privateSelectors = {
    rootForm,
    userProfile
};
