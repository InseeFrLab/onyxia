import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { objectKeys } from "tsafe/objectKeys";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import type { ProjectConfigs } from "core/usecases/projectManagement";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import * as s3CredentialsTest from "core/usecases/_s3Next/s3CredentialsTest";
import { same } from "evt/tools/inDepth/same";

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

const submittableFormValuesAsProjectS3Config = createSelector(
    isReady,
    formValues,
    formattedFormValuesUrl,
    isFormSubmittable,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.s3ProfileCreationTime;
    }),
    (
        isReady,
        formValues,
        formattedFormValuesUrl,
        isFormSubmittable,
        s3ProfileCreationTime
    ) => {
        if (!isReady) {
            return null;
        }
        assert(formValues !== null);
        assert(formattedFormValuesUrl !== null);
        assert(isFormSubmittable !== null);
        assert(s3ProfileCreationTime !== null);

        if (!isFormSubmittable) {
            return undefined;
        }

        assert(formattedFormValuesUrl !== undefined);

        return id<ProjectConfigs.S3Config>({
            creationTime: s3ProfileCreationTime,
            friendlyName: formValues.friendlyName.trim(),
            url: formattedFormValuesUrl,
            region: formValues.region?.trim(),
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
            // TODO: Delete once we move on
            workingDirectoryPath: "mybucket/my/prefix/",
            bookmarks: []
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

type CredentialsTestStatus =
    | { status: "test ongoing" }
    | { status: "test succeeded" }
    | { status: "test failed"; errorMessage: string }
    | { status: "not tested" };

const credentialsTestStatus = createSelector(
    isReady,
    isFormSubmittable,
    paramsOfCreateS3Client,
    s3CredentialsTest.protectedSelectors.credentialsTestState,
    (
        isReady,
        isFormSubmittable,
        paramsOfCreateS3Client,
        credentialsTestState
    ): CredentialsTestStatus | null => {
        if (!isReady) {
            return null;
        }

        assert(isFormSubmittable !== null);
        assert(paramsOfCreateS3Client !== null);

        if (!isFormSubmittable) {
            return { status: "not tested" };
        }

        assert(paramsOfCreateS3Client !== undefined);

        if (
            credentialsTestState.ongoingTests.find(e =>
                same(e.paramsOfCreateS3Client, paramsOfCreateS3Client)
            ) !== undefined
        ) {
            return { status: "test ongoing" };
        }

        has_result: {
            const { result } =
                credentialsTestState.testResults.find(e =>
                    same(e.paramsOfCreateS3Client, paramsOfCreateS3Client)
                ) ?? {};

            if (result === undefined) {
                break has_result;
            }

            return result.isSuccess
                ? { status: "test succeeded" }
                : { status: "test failed", errorMessage: result.errorMessage };
        }

        return { status: "not tested" } as CredentialsTestStatus;
    }
);

const urlStylesExamples = createSelector(
    isReady,
    formattedFormValuesUrl,
    (isReady, formattedFormValuesUrl) => {
        if (!isReady) {
            return null;
        }

        assert(formattedFormValuesUrl !== null);

        if (formattedFormValuesUrl === undefined) {
            return undefined;
        }

        const urlObject = new URL(formattedFormValuesUrl);

        const bucketName = "mybucket";
        const objectNamePrefix = "my/object/name/prefix/";

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

const isEditionOfAnExistingConfig = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.action === "Update existing S3 profile";
});

const main = createSelector(
    isReady,
    formValues,
    formValuesErrors,
    isFormSubmittable,
    urlStylesExamples,
    isEditionOfAnExistingConfig,
    credentialsTestStatus,
    (
        isReady,
        formValues,
        formValuesErrors,
        isFormSubmittable,
        urlStylesExamples,
        isEditionOfAnExistingConfig,
        credentialsTestStatus
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
        assert(credentialsTestStatus !== null);

        return {
            isReady: true,
            formValues,
            formValuesErrors,
            isFormSubmittable,
            urlStylesExamples,
            isEditionOfAnExistingConfig,
            credentialsTestStatus
        };
    }
);

export const privateSelectors = {
    formattedFormValuesUrl,
    submittableFormValuesAsProjectS3Config,
    formValuesErrors,
    paramsOfCreateS3Client
};

export const selectors = { main };
