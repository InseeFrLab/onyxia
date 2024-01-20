import type { State as RootState } from "core/bootstrap";
import { createSelector } from "redux-clean-architecture";
import { name } from "./state";
import { objectKeys } from "tsafe/objectKeys";
import { assert } from "tsafe/assert";
import { bucketNameAndObjectNameFromS3Path } from "core/adapters/s3Client/utils/bucketNameAndObjectNameFromS3Path";

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
                    new URL(value.startsWith("http") ? value : `https://${value}`);
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

        if (connectionTestStatus.isTestOngoing) {
            return false;
        }

        return objectKeys(formValuesErrors).every(
            key => formValuesErrors[key] === undefined
        );
    }
);

export const submittableFormValues = createSelector(
    isReady,
    formValues,
    (isReady, formValues) => {
        if (!isReady) {
            return undefined;
        }

        assert(formValues !== undefined);

        return {
            "url": ((trimmedValue: string) =>
                trimmedValue.startsWith("http")
                    ? trimmedValue
                    : `https://${trimmedValue}`)(formValues.url.trim()),
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
            "sessionToken": formValues.sessionToken?.trim()
        };
    }
);

const urlStylesExamples = createSelector(
    isReady,
    submittableFormValues,
    formValuesErrors,
    (isReady, submittableFormValues, formValuesErrors) => {
        if (!isReady) {
            return undefined;
        }

        assert(submittableFormValues !== undefined);
        assert(formValuesErrors !== undefined);

        if (
            formValuesErrors.url !== undefined ||
            formValuesErrors.workingDirectoryPath !== undefined
        ) {
            return undefined;
        }

        const urlObject = new URL(submittableFormValues.url);

        const { bucketName, objectName: objectNamePrefix } =
            bucketNameAndObjectNameFromS3Path(submittableFormValues.workingDirectoryPath);

        const domain = submittableFormValues.url
            .split(urlObject.protocol)[1]
            .split("//")[1]
            .replace(/\/$/, "");

        console.log({
            "domain": domain,
            "bucketName": bucketName,
            "objectNamePrefix": objectNamePrefix,
            "workingDirectoryPath": submittableFormValues.workingDirectoryPath
        });

        return {
            "pathStyle": `${domain}/${bucketName}/${objectNamePrefix}`,
            "virtualHostedStyle": `${bucketName}.${domain}/${objectNamePrefix}`
        };
    }
);

const customConfigIndex = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.customConfigIndex;
});

const isEditionOfAnExistingConfig = createSelector(
    isReady,
    customConfigIndex,
    (isReady, customConfigIndex) => {
        if (!isReady) {
            return undefined;
        }

        return customConfigIndex !== undefined;
    }
);

const main = createSelector(
    isReady,
    formValues,
    connectionTestStatus,
    formValuesErrors,
    isFormSubmittable,
    urlStylesExamples,
    isEditionOfAnExistingConfig,
    (
        isReady,
        formValues,
        connectionTestStatus,
        formValuesErrors,
        isFormSubmittable,
        urlStylesExamples,
        isEditionOfAnExistingConfig
    ) => {
        if (!isReady) {
            return {
                "isReady": false as const
            };
        }

        assert(formValues !== undefined);
        assert(connectionTestStatus !== undefined);
        assert(formValuesErrors !== undefined);
        assert(isFormSubmittable !== undefined);
        assert(isEditionOfAnExistingConfig !== undefined);

        return {
            "isReady": true,
            formValues,
            connectionTestStatus,
            formValuesErrors,
            isFormSubmittable,
            urlStylesExamples,
            isEditionOfAnExistingConfig
        };
    }
);

export const privateSelectors = {
    submittableFormValues,
    formValuesErrors,
    customConfigIndex,
    connectionTestStatus
};

export const selectors = { main };
