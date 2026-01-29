import type { Thunks } from "core/bootstrap";
import { actions, type State, type ChangeValueParams } from "./state";
import { assert } from "tsafe/assert";
import { privateSelectors } from "./selectors";
import * as s3ProfilesManagement from "core/usecases/_s3Next/s3ProfilesManagement";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";

export const thunks = {
    initialize:
        (params: {
            // NOTE: Undefined for creation
            profileName_toUpdate: string | undefined;
        }) =>
        async (...args) => {
            const { profileName_toUpdate } = params;

            const [dispatch, getState] = args;

            const s3Profiles = s3ProfilesManagement.selectors.s3Profiles(getState());

            update_existing_config: {
                if (profileName_toUpdate === undefined) {
                    break update_existing_config;
                }

                const s3Profile = s3Profiles.find(
                    s3Profile => s3Profile.profileName === profileName_toUpdate
                );

                assert(s3Profile !== undefined);
                assert(s3Profile.origin === "created by user (or group project member)");

                dispatch(
                    actions.initialized({
                        creationTimeOfProfileToEdit: s3Profile.creationTime,
                        initialFormValues: {
                            profileName: s3Profile.profileName,
                            url: s3Profile.paramsOfCreateS3Client.url,
                            region: s3Profile.paramsOfCreateS3Client.region,
                            pathStyleAccess:
                                s3Profile.paramsOfCreateS3Client.pathStyleAccess,
                            ...(() => {
                                if (
                                    s3Profile.paramsOfCreateS3Client.credentials ===
                                    undefined
                                ) {
                                    return {
                                        isAnonymous: true,
                                        accessKeyId: undefined,
                                        secretAccessKey: undefined,
                                        sessionToken: undefined
                                    };
                                }

                                return {
                                    isAnonymous: false,
                                    accessKeyId:
                                        s3Profile.paramsOfCreateS3Client.credentials
                                            .accessKeyId,
                                    secretAccessKey:
                                        s3Profile.paramsOfCreateS3Client.credentials
                                            .secretAccessKey,
                                    sessionToken:
                                        s3Profile.paramsOfCreateS3Client.credentials
                                            .sessionToken
                                };
                            })()
                        }
                    })
                );

                return;
            }

            const { s3Profiles_defaultValuesOfCreationForm } =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());

            if (s3Profiles_defaultValuesOfCreationForm === undefined) {
                dispatch(
                    actions.initialized({
                        creationTimeOfProfileToEdit: undefined,
                        initialFormValues: {
                            profileName: "",
                            url: "",
                            region: undefined,
                            pathStyleAccess: false,
                            isAnonymous: true,
                            accessKeyId: undefined,
                            secretAccessKey: undefined,
                            sessionToken: undefined
                        }
                    })
                );
                return;
            }

            dispatch(
                actions.initialized({
                    creationTimeOfProfileToEdit: undefined,
                    initialFormValues: {
                        profileName: "",
                        url: s3Profiles_defaultValuesOfCreationForm.url,
                        region: s3Profiles_defaultValuesOfCreationForm.region,
                        pathStyleAccess:
                            s3Profiles_defaultValuesOfCreationForm.pathStyleAccess ??
                            false,
                        isAnonymous: false,
                        accessKeyId: undefined,
                        secretAccessKey: undefined,
                        sessionToken: undefined
                    }
                })
            );
        },
    reset:
        () =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.stateResetToNotInitialized());
        },
    submit:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const s3Profile_vault =
                privateSelectors.submittableFormValuesAsS3Profile_vault(getState());

            assert(s3Profile_vault !== null);
            assert(s3Profile_vault !== undefined);

            await dispatch(
                s3ProfilesManagement.protectedThunks.createOrUpdateS3Profile({
                    s3Profile_vault: {
                        ...s3Profile_vault,
                        creationTime: s3Profile_vault.creationTime ?? Date.now()
                    }
                })
            );

            dispatch(actions.stateResetToNotInitialized());
        },
    changeValue:
        <K extends keyof State.Ready.FormValues>(params: ChangeValueParams<K>) =>
        async (...args) => {
            const { key, value } = params;

            const [dispatch, getState] = args;
            dispatch(actions.formValueChanged({ key, value }));

            preset_pathStyleAccess: {
                if (key !== "url") {
                    break preset_pathStyleAccess;
                }

                const url = privateSelectors.formattedFormValuesUrl(getState());

                assert(url !== null);

                if (url === undefined) {
                    break preset_pathStyleAccess;
                }

                if (url.toLowerCase().includes("amazonaws.com")) {
                    dispatch(
                        actions.formValueChanged({
                            key: "pathStyleAccess",
                            value: false
                        })
                    );
                    break preset_pathStyleAccess;
                }

                if (url.toLocaleLowerCase().includes("minio")) {
                    dispatch(
                        actions.formValueChanged({
                            key: "pathStyleAccess",
                            value: true
                        })
                    );
                    break preset_pathStyleAccess;
                }
            }
        }
} satisfies Thunks;
