import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { objectKeys } from "tsafe/objectKeys";
import { assert, type Equals } from "tsafe/assert";
import { parseS3UriPrefix } from "core/tools/S3Uri";
import { id } from "tsafe/id";
import type { ProjectConfigs } from "core/usecases/projectManagement";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import * as s3ConfigConnectionTest from "core/usecases/s3ConfigConnectionTest";
import { same } from "evt/tools/inDepth/same";
import { parseProjectS3ConfigId } from "core/usecases/s3ConfigManagement/decoupledLogic/projectS3ConfigId";

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
                        key === "friendlyName" ||
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
    (isReady, formValuesErrors) => {
        if (!isReady) {
            return null;
        }

        assert(formValuesErrors !== null);

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

const action = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.action;
});

const submittableFormValuesAsProjectS3Config = createSelector(
    isReady,
    formValues,
    formattedFormValuesUrl,
    formattedFormValuesWorkingDirectoryPath,
    isFormSubmittable,
    action,
    (
        isReady,
        formValues,
        formattedFormValuesUrl,
        formattedFormValuesWorkingDirectoryPath,
        isFormSubmittable,
        action
    ) => {
        if (!isReady) {
            return null;
        }
        assert(formValues !== null);
        assert(formattedFormValuesUrl !== null);
        assert(formattedFormValuesWorkingDirectoryPath !== null);
        assert(formattedFormValuesUrl !== null);
        assert(formattedFormValuesWorkingDirectoryPath !== null);
        assert(isFormSubmittable !== null);
        assert(action !== null);

        if (!isFormSubmittable) {
            return undefined;
        }

        assert(formattedFormValuesUrl !== undefined);
        assert(formattedFormValuesWorkingDirectoryPath !== undefined);

        return id<ProjectConfigs.S3Config>({
            creationTime: (() => {
                switch (action.type) {
                    case "create new config":
                        return action.creationTime;
                    case "update existing config":
                        return parseProjectS3ConfigId({ s3ConfigId: action.s3ConfigId })
                            .creationTime;
                }
                assert<Equals<typeof action, never>>(false);
            })(),
            friendlyName: formValues.friendlyName.trim(),
            url: formattedFormValuesUrl,
            region: formValues.region?.trim(),
            workingDirectoryPath: formattedFormValuesWorkingDirectoryPath,
            pathStyleAccess: formValues.pathStyleAccess,
            credentials: (() => {
                if (formValues.isAnonymous) {
                    return undefined;
                }

                assert(formValues.accessKeyId !== undefined);
                assert(formValues.secretAccessKey !== undefined);

                return {
                    accessKeyId: formValues.accessKeyId,
                    secretAccessKey: formValues.secretAccessKey,
                    sessionToken: formValues.sessionToken
                };
            })(),
            bookmarks: undefined
        });
    }
);

const paramsOfCreateS3Client = createSelector(
    isReady,
    submittableFormValuesAsProjectS3Config,
    (isReady, submittableFormValuesAsProjectS3Config) => {
        if (!isReady) {
            return null;
        }

        assert(submittableFormValuesAsProjectS3Config !== null);

        if (submittableFormValuesAsProjectS3Config === undefined) {
            return undefined;
        }

        return id<ParamsOfCreateS3Client.NoSts>({
            url: submittableFormValuesAsProjectS3Config.url,
            pathStyleAccess: submittableFormValuesAsProjectS3Config.pathStyleAccess,
            isStsEnabled: false,
            region: submittableFormValuesAsProjectS3Config.region,
            credentials: submittableFormValuesAsProjectS3Config.credentials
        });
    }
);

type ConnectionTestStatus =
    | { status: "test ongoing" }
    | { status: "test succeeded" }
    | { status: "test failed"; errorMessage: string }
    | { status: "not tested" };

const connectionTestStatus = createSelector(
    isReady,
    isFormSubmittable,
    paramsOfCreateS3Client,
    formattedFormValuesWorkingDirectoryPath,
    s3ConfigConnectionTest.protectedSelectors.configTestResults,
    s3ConfigConnectionTest.protectedSelectors.ongoingConfigTests,
    (
        isReady,
        isFormSubmittable,
        paramsOfCreateS3Client,
        workingDirectoryPath,
        configTestResults,
        ongoingConfigTests
    ): ConnectionTestStatus | null => {
        if (!isReady) {
            return null;
        }

        assert(isFormSubmittable !== null);
        assert(paramsOfCreateS3Client !== null);
        assert(workingDirectoryPath !== null);

        if (!isFormSubmittable) {
            return { status: "not tested" };
        }

        assert(paramsOfCreateS3Client !== undefined);
        assert(workingDirectoryPath !== undefined);

        if (
            ongoingConfigTests.find(
                e =>
                    same(e.paramsOfCreateS3Client, paramsOfCreateS3Client) &&
                    e.workingDirectoryPath === workingDirectoryPath
            ) !== undefined
        ) {
            return { status: "test ongoing" };
        }

        has_result: {
            const { result } =
                configTestResults.find(
                    e =>
                        same(e.paramsOfCreateS3Client, paramsOfCreateS3Client) &&
                        e.workingDirectoryPath === workingDirectoryPath
                ) ?? {};

            if (result === undefined) {
                break has_result;
            }

            return result.isSuccess
                ? { status: "test succeeded" }
                : { status: "test failed", errorMessage: result.errorMessage };
        }

        return { status: "not tested" } as ConnectionTestStatus;
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

        const { bucket: bucketName, keyPrefix: objectNamePrefix } = parseS3UriPrefix({
            s3UriPrefix: `s3://${formattedFormValuesWorkingDirectoryPath}`,
            strict: false
        });

        const domain = formattedFormValuesUrl
            .split(urlObject.protocol)[1]
            .split("//")[1]
            .replace(/\/$/, "");

        return {
            pathStyle: `${domain}/${bucketName}/${objectNamePrefix}`,
            virtualHostedStyle: `${bucketName}.${domain}/${objectNamePrefix}`
        };
    }
);

const isEditionOfAnExistingConfig = createSelector(isReady, action, (isReady, action) => {
    if (!isReady) {
        return null;
    }

    assert(action !== null);

    return action.type === "update existing config";
});

const main = createSelector(
    isReady,
    formValues,
    formValuesErrors,
    isFormSubmittable,
    urlStylesExamples,
    isEditionOfAnExistingConfig,
    connectionTestStatus,
    (
        isReady,
        formValues,
        formValuesErrors,
        isFormSubmittable,
        urlStylesExamples,
        isEditionOfAnExistingConfig,
        connectionTestStatus
    ) => {
        if (!isReady) {
            return {
                isReady: false as const
            };
        }

        assert(formValues !== null);
        assert(formValuesErrors !== null);
        assert(isFormSubmittable !== null);
        assert(urlStylesExamples !== null);
        assert(isEditionOfAnExistingConfig !== null);
        assert(connectionTestStatus !== null);

        return {
            isReady: true,
            formValues,
            formValuesErrors,
            isFormSubmittable,
            urlStylesExamples,
            isEditionOfAnExistingConfig,
            connectionTestStatus
        };
    }
);

export const privateSelectors = {
    formattedFormValuesUrl,
    submittableFormValuesAsProjectS3Config,
    formValuesErrors,
    paramsOfCreateS3Client,
    formattedFormValuesWorkingDirectoryPath
};

export const selectors = { main };
