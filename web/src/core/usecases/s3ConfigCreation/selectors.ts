import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { objectKeys } from "tsafe/objectKeys";
import { assert } from "tsafe/assert";
import { bucketNameAndObjectNameFromS3Path } from "core/adapters/s3Client/utils/bucketNameAndObjectNameFromS3Path";
import { id } from "tsafe/id";
import type { ProjectConfigs } from "core/usecases/projectManagement";

const readyState = (rootState: RootState) => {
    const state = rootState[name];

    if (state.stateDescription !== "ready") {
        return null;
    }

    return state;
};

const isReady = createSelector(readyState, state => state !== null);

const formValues = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.formValues;
});

const connectionTestStatus = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.connectionTestStatus;
});

const formValuesErrors = createSelector(formValues, formValues => {
    if (formValues === null) {
        return null;
    }

    const out: Record<
        keyof typeof formValues,
        "must be an url" | "is required" | "not a valid access key id" | undefined
    > = {} as any;

    for (const key of objectKeys(formValues)) {
        out[key] = (() => {
            required_fields: {
                if (
                    !(
                        key === "url" ||
                        key === "workingDirectoryPath" ||
                        key === "accountFriendlyName" ||
                        (!formValues.isAnonymous &&
                            (key === "accessKeyId" || key === "secretAccessKey"))
                    )
                ) {
                    break required_fields;
                }

                const value = formValues[key];

                if ((value ?? "").trim() !== "") {
                    break required_fields;
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
            return null;
        }

        assert(formValuesErrors !== null);
        assert(connectionTestStatus !== null);

        if (connectionTestStatus.isTestOngoing) {
            return false;
        }

        return objectKeys(formValuesErrors).every(
            key => formValuesErrors[key] === undefined
        );
    }
);

const formattedFormValuesUrl = createSelector(
    isReady,
    formValues,
    formValuesErrors,
    (isReady, formValues, formValuesErrors) => {
        if (!isReady) {
            return null;
        }
        assert(formValues !== null);
        assert(formValuesErrors !== null);

        if (formValuesErrors.url !== undefined) {
            return undefined;
        }

        const trimmedValue = formValues.url.trim();

        return trimmedValue.startsWith("http") ? trimmedValue : `https://${trimmedValue}`;
    }
);

const formattedFormValuesWorkingDirectoryPath = createSelector(
    isReady,
    formValues,
    formValuesErrors,
    (isReady, formValues, formValuesErrors) => {
        if (!isReady) {
            return null;
        }
        assert(formValues !== null);
        assert(formValuesErrors !== null);

        if (formValuesErrors.workingDirectoryPath !== undefined) {
            return undefined;
        }

        return (
            formValues.workingDirectoryPath
                .trim()
                .replace(/\/\//g, "/") // Remove double slashes if any
                .replace(/^\//g, "") // Ensure no leading slash
                .replace(/\/*$/g, "") + "/"
        ); // Enforce trailing slash
    }
);

const submittableFormValuesAsCustomS3Config = createSelector(
    isReady,
    formValues,
    formattedFormValuesUrl,
    formattedFormValuesWorkingDirectoryPath,
    (
        isReady,
        formValues,
        formattedFormValuesUrl,
        formattedFormValuesWorkingDirectoryPath
    ) => {
        if (!isReady) {
            return null;
        }
        assert(formValues !== null);
        assert(formattedFormValuesUrl !== null);
        assert(formattedFormValuesWorkingDirectoryPath !== null);

        assert(formattedFormValuesUrl !== undefined);
        assert(formattedFormValuesWorkingDirectoryPath !== undefined);

        return id<ProjectConfigs.CustomS3Config>({
            "url": formattedFormValuesUrl,
            "region": formValues.region.trim(),
            "workingDirectoryPath": formattedFormValuesWorkingDirectoryPath,
            "pathStyleAccess": formValues.pathStyleAccess,
            "accountFriendlyName": formValues.accountFriendlyName.trim(),

            "credentials": (() => {
                if (formValues.isAnonymous) {
                    return undefined;
                }

                assert(formValues.accessKeyId !== undefined);
                assert(formValues.secretAccessKey !== undefined);

                return {
                    "accessKeyId": formValues.accessKeyId,
                    "secretAccessKey": formValues.secretAccessKey,
                    "sessionToken": formValues.sessionToken
                };
            })()
        });
    }
);

const urlStylesExamples = createSelector(
    isReady,
    formattedFormValuesUrl,
    formattedFormValuesWorkingDirectoryPath,
    (isReady, formattedFormValuesUrl, formattedFormValuesWorkingDirectoryPath) => {
        if (!isReady) {
            return null;
        }

        assert(formattedFormValuesUrl !== null);
        assert(formattedFormValuesWorkingDirectoryPath !== null);

        if (
            formattedFormValuesUrl === undefined ||
            formattedFormValuesWorkingDirectoryPath === undefined
        ) {
            return undefined;
        }

        const urlObject = new URL(formattedFormValuesUrl);

        const { bucketName, objectName: objectNamePrefix } =
            bucketNameAndObjectNameFromS3Path(formattedFormValuesWorkingDirectoryPath);

        const domain = formattedFormValuesUrl
            .split(urlObject.protocol)[1]
            .split("//")[1]
            .replace(/\/$/, "");

        return {
            "pathStyle": `${domain}/${bucketName}/${objectNamePrefix}`,
            "virtualHostedStyle": `${bucketName}.${domain}/${objectNamePrefix}`
        };
    }
);

const customConfigIndex = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.customConfigIndex;
});

const isEditionOfAnExistingConfig = createSelector(
    isReady,
    customConfigIndex,
    (isReady, customConfigIndex) => {
        if (!isReady) {
            return null;
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

        assert(formValues !== null);
        assert(connectionTestStatus !== null);
        assert(formValuesErrors !== null);
        assert(isFormSubmittable !== null);
        assert(urlStylesExamples !== null);
        assert(isEditionOfAnExistingConfig !== null);

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
    formattedFormValuesUrl,
    submittableFormValuesAsCustomS3Config,
    formValuesErrors,
    customConfigIndex,
    connectionTestStatus
};

export const selectors = { main };
