import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import * as gitForgesManagement from "core/usecases/gitForgesManagement";
import * as gitAccountUiController from "core/usecases/gitAccountUiController";
import * as launcher from "core/usecases/launcher";
import { getValueAtPath } from "core/tools/Stringifyable/getValueAtPath";
import { getGitRepositoryValue } from "core/usecases/launcher/decoupledLogic/shared/getGitRepositoryValue";
import { name } from "./state";
import { computeField, type FieldView, type Value } from "./decoupledLogic";

const state = (rootState: RootState) => rootState[name];

const fieldStateByFieldId = createSelector(state, state => state.fieldStateByFieldId);

const repositorySearchCacheByKey = createSelector(
    state,
    state => state.repositorySearchCacheByKey
);

/** The value of each field, in the launcher's helm values */
const valueByFieldId = createSelector(
    fieldStateByFieldId,
    launcher.protectedSelectors.helmValues,
    (fieldStateByFieldId, helmValues): Record<string, Value> =>
        Object.fromEntries(
            Object.entries(fieldStateByFieldId).map(([fieldId, { helmValuesPath }]) => [
                fieldId,
                getGitRepositoryValue(
                    helmValues === null
                        ? undefined
                        : getValueAtPath({
                              stringifyableObjectOrArray: helmValues,
                              path: helmValuesPath,
                              doDeleteFromSource: false,
                              doFailOnUnresolved: false
                          })
                )
            ])
        )
);

const fieldByFieldId = createSelector(
    fieldStateByFieldId,
    valueByFieldId,
    gitForgesManagement.selectors.connectedForges,
    gitAccountUiController.selectors.disconnectedForges,
    repositorySearchCacheByKey,
    (
        fieldStateByFieldId,
        valueByFieldId,
        connectedForges,
        disconnectedForges,
        repositorySearchCacheByKey
    ) =>
        Object.fromEntries(
            Object.entries(fieldStateByFieldId).map(([fieldId, fieldState]) => [
                fieldId,
                computeField({
                    fieldState,
                    value: valueByFieldId[fieldId],
                    connectedForges,
                    disconnectedForges,
                    repositorySearchCacheByKey
                })
            ])
        )
);

/** The fields' views, a field isn't there until initialized */
const viewByFieldId = createSelector(
    fieldByFieldId,
    (fieldByFieldId): Record<string, FieldView | undefined> =>
        Object.fromEntries(
            Object.entries(fieldByFieldId).map(([fieldId, { view }]) => [fieldId, view])
        )
);

export const selectors = { viewByFieldId };

export const privateSelectors = { fieldByFieldId, fieldStateByFieldId, valueByFieldId };
