import type { Thunks } from "core/bootstrap";
import { actions, type State, type ChangeValueParams } from "./state";
import { assert } from "tsafe/assert";
import { privateSelectors } from "./selectors";
import * as s3ProfilesManagement from "core/usecases/_s3Next/s3ProfilesManagement";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";

export const thunks = {
    initialize:
        (params: { creationTimeOfS3ProfileToEdit: number | undefined }) =>
        async (...args) => {
            const { creationTimeOfS3ProfileToEdit } = params;

            const [dispatch, getState] = args;

            const s3Profiles = s3ProfilesManagement.selectors.s3Profiles(getState());

            update_existing_config: {
                if (creationTimeOfS3ProfileToEdit === undefined) {
                    break update_existing_config;
                }

                const s3Profile = s3Profiles
                    .filter(
                        s3Profile =>
                            s3Profile.origin ===
                            "created by user (or group project member)"
                    )
                    .find(
                        s3Profile =>
                            s3Profile.creationTime === creationTimeOfS3ProfileToEdit
                    );

                assert(s3Profile !== undefined);

                dispatch(
                    actions.initialized({
                        creationTimeOfS3ProfileToEdit,
                        initialFormValues: {
                            friendlyName: s3Profile.friendlyName,
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
                deploymentRegionManagement.selectors.currentDeploymentRegion(
                    getState()
                )._s3Next;

            if (s3Profiles_defaultValuesOfCreationForm === undefined) {
                dispatch(
                    actions.initialized({
                        creationTimeOfS3ProfileToEdit: undefined,
                        initialFormValues: {
                            friendlyName: "",
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
                    creationTimeOfS3ProfileToEdit: undefined,
                    initialFormValues: {
                        friendlyName: "",
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

            const s3Config_vault =
                privateSelectors.submittableFormValuesAsProjectS3Config(getState());

            assert(s3Config_vault !== null);
            assert(s3Config_vault !== undefined);

            await dispatch(
                s3ProfilesManagement.protectedThunks.createOrUpdateS3Profile({
                    s3Config_vault
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
