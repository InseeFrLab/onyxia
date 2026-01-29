import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { objectKeys } from "tsafe/objectKeys";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import type { ProjectConfigs } from "core/usecases/projectManagement";
import * as s3ProfilesManagement from "core/usecases/_s3Next/s3ProfilesManagement";
import * as projectManagement from "core/usecases/projectManagement";

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

const existingProfileNames = createSelector(
    isReady,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.creationTimeOfProfileToEdit;
    }),
    s3ProfilesManagement.selectors.s3Profiles,
    (isReady, creationTimeOfProfileToEdit, s3Profiles) => {
        if (!isReady) {
            return null;
        }

        assert(creationTimeOfProfileToEdit !== null);

        return s3Profiles
            .filter(s3Profile => {
                if (creationTimeOfProfileToEdit === undefined) {
                    return true;
                }

                if (s3Profile.origin !== "created by user (or group project member)") {
                    return true;
                }

                if (s3Profile.creationTime === creationTimeOfProfileToEdit) {
                    return false;
                }

                return true;
            })
            .map(s3Profile => s3Profile.profileName);
    }
);

const formValuesErrors = createSelector(
    isReady,
    formValues,
    existingProfileNames,
    (isReady, formValues, existingProfileNames) => {
        if (!isReady) {
            return null;
        }

        assert(formValues !== null);
        assert(existingProfileNames !== null);

        const out: Record<
            keyof typeof formValues,
            | "must be an url"
            | "is required"
            | "not a valid access key id"
            | "profile name already used"
            | undefined
        > = {} as any;

        for (const key of objectKeys(formValues)) {
            out[key] = (() => {
                required_fields: {
                    if (
                        !(
                            key === "url" ||
                            key === "profileName" ||
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

                if (key === "profileName") {
                    const value = formValues[key];

                    if (existingProfileNames.includes(value)) {
                        return "profile name already used";
                    }
                }

                return undefined;
            })();
        }

        return out;
    }
);

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

const submittableFormValuesAsS3Profile_vault = createSelector(
    isReady,
    formValues,
    formattedFormValuesUrl,
    isFormSubmittable,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.creationTimeOfProfileToEdit;
    }),
    projectManagement.protectedSelectors.projectConfig,
    (
        isReady,
        formValues,
        formattedFormValuesUrl,
        isFormSubmittable,
        creationTimeOfProfileToEdit,
        projectConfig
    ) => {
        if (!isReady) {
            return null;
        }
        assert(formValues !== null);
        assert(formattedFormValuesUrl !== null);
        assert(isFormSubmittable !== null);
        assert(creationTimeOfProfileToEdit !== null);

        if (!isFormSubmittable) {
            return undefined;
        }

        assert(formattedFormValuesUrl !== undefined);

        const s3Profile_vault_current = (() => {
            if (creationTimeOfProfileToEdit === undefined) {
                return undefined;
            }

            const s3Profile_vault_current = projectConfig.s3Profiles.find(
                s3Config => s3Config.creationTime === creationTimeOfProfileToEdit
            );

            assert(s3Profile_vault_current !== undefined);

            return s3Profile_vault_current;
        })();

        return id<
            Omit<ProjectConfigs.S3Profile, "creationTime"> & {
                creationTime: number | undefined;
            }
        >({
            creationTime:
                s3Profile_vault_current === undefined
                    ? undefined
                    : s3Profile_vault_current.creationTime,
            profileName: formValues.profileName.trim(),
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
            bookmarks:
                s3Profile_vault_current === undefined
                    ? []
                    : s3Profile_vault_current.bookmarks
        });
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

const main = createSelector(
    isReady,
    formValues,
    formValuesErrors,
    isFormSubmittable,
    urlStylesExamples,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.creationTimeOfProfileToEdit !== undefined;
    }),
    (
        isReady,
        formValues,
        formValuesErrors,
        isFormSubmittable,
        urlStylesExamples,
        isEditionOfAnExistingConfig
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

        return {
            isReady: true,
            formValues,
            formValuesErrors,
            isFormSubmittable,
            urlStylesExamples,
            isEditionOfAnExistingConfig
        };
    }
);

export const privateSelectors = {
    formattedFormValuesUrl,
    submittableFormValuesAsS3Profile_vault,
    formValuesErrors
};

export const selectors = { main };
