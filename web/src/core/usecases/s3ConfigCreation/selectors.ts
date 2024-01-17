import type { State as RootState } from "core/bootstrap";
import { createSelector } from "redux-clean-architecture";
import { name } from "./state";

const readyState = (rootState: RootState) => {
    const state = rootState[name];

    if (state.stateDescription !== "ready") {
        return undefined;
    }

    return state;
};

const formValues = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.formValues;
});

/*
const connectionTestStatus = createSelector(readyState, state => {
    
        if( state === undefined ){
            return undefined;
        }
    
        return state.connectionTestStatus;
    
});

const formValuesErrors = createSelector(formValues, formValues => {



});
*/

export const protectedSelectors = {
    formValues
};

export const selectors = {};
