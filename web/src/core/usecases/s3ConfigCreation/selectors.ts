import type { State as RootState } from "core/bootstrap";
import { createSelector } from "redux-clean-architecture";
import { name } from "./state";
import { objectKeys } from "tsafe/objectKeys";
import { assert } from "tsafe/assert";

const readyState = (rootState: RootState) => {
    const state = rootState[name];

    if (state.stateDescription !== "ready") {
        return undefined;
    }

    return state;
};

const isReady = createSelector(readyState, state => state !== undefined);

const formValues = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.formValues;
});

const connectionTestStatus = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.connectionTestStatus;
});

const formValuesErrors = createSelector(formValues, formValues => {
    if (formValues === undefined) {
        return undefined;
    }

    const out: Record<
        keyof typeof formValues,
        "must be an url" | "is required" | "not a valid access key id" | undefined
    > = {} as any;

    for (const key of objectKeys(formValues)) {
        out[key] = (() => {
            empty_required_field: {
                const value = formValues[key];

                if (typeof value !== "string") {
                    break empty_required_field;
                }

                if (
                    !(
                        key === "url" ||
                        key === "workingDirectoryPath" ||
                        key === "accountFriendlyName" ||
                        key === "accessKeyId" ||
                        key === "secretAccessKey"
                    )
                ) {
                    break empty_required_field;
                }

                if (value.trim() !== "") {
                    break empty_required_field;
                }

                return "is required";
            }

            if (key === "url") {
                const value = formValues[key];

                try {
                    new URL(value);
                } catch {
                    return "must be an url";
                }
            }

            return undefined;
        })();
    }

    return out;
});

const isFormSubmittable = createSelector(
    isReady,
    formValuesErrors,
    connectionTestStatus,
    (isReady, formValuesErrors, connectionTestStatus) => {
        if (!isReady) {
            return undefined;
        }

        assert(formValuesErrors !== undefined);
        assert(connectionTestStatus !== undefined);

        if (connectionTestStatus.itTestOngoing) {
            return false;
        }

        return objectKeys(formValuesErrors).every(
            key => formValuesErrors[key] === undefined
        );
    }
);

const main = createSelector(
    isReady,
    formValues,
    connectionTestStatus,
    formValuesErrors,
    isFormSubmittable,
    (isReady, formValues, connectionTestStatus, formValuesErrors, isFormSubmittable) => {
        if (!isReady) {
            return {
                "isReady": false as const
            };
        }

        assert(formValues !== undefined);
        assert(connectionTestStatus !== undefined);
        assert(formValuesErrors !== undefined);
        assert(isFormSubmittable !== undefined);

        return {
            "isReady": true,
            formValues,
            connectionTestStatus,
            formValuesErrors,
            isFormSubmittable
        };
    }
);

export const submittableFormValues = createSelector(
    isReady,
    formValues,
    isFormSubmittable,
    (isReady, formValues, isFormSubmittable) => {
        if (!isReady) {
            return undefined;
        }

        assert(formValues !== undefined);
        assert(isFormSubmittable === true);

        return {
            "url": formValues.url.trim(),
            "region": formValues.region.trim(),
            "workingDirectoryPath":
                formValues.workingDirectoryPath
                    .trim()
                    .replace(/\/\//g, "/") // Remove double slashes if any
                    .replace(/^\//g, "") // Ensure no leading slash
                    .replace(/\/$/g, "") + "/", // Enforce trailing slash
            "pathStyleAccess": formValues.pathStyleAccess,
            "accountFriendlyName": formValues.accountFriendlyName.trim(),
            "accessKeyId": formValues.accessKeyId.trim(),
            "secretAccessKey": formValues.secretAccessKey.trim(),
            "sessionToken": formValues.sessionToken?.trim(),
            "isUsedForExplorer": formValues.isUsedForExplorer,
            "isUsedForXOnyxia": formValues.isUsedForXOnyxia
        };
    }
);

export const privateSelectors = {
    submittableFormValues,
    formValuesErrors
};

export const selectors = { main };
