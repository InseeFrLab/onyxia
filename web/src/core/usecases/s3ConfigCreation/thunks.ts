import type { Thunks } from "core/bootstrap";
import { actions, type State, ChangeValueParams } from "./state";
import { assert } from "tsafe/assert";
import { privateSelectors } from "./selectors";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { getWorkingDirectoryPath } from "core/usecases/s3ConfigManagement/decoupledLogic/getWorkingDirectoryPath";
import * as projectManagement from "core/usecases/projectManagement";
import * as userAuthentication from "core/usecases/userAuthentication";
import * as s3ConfigConnectionTest from "core/usecases/s3ConfigConnectionTest";

export const thunks = {
    initialize:
        (params: { s3ConfigIdToEdit: string | undefined }) =>
        async (...args) => {
            const { s3ConfigIdToEdit } = params;

            const [dispatch, getState] = args;

            const s3Configs = s3ConfigManagement.selectors.s3Configs(getState());

            update_existing_config: {
                if (s3ConfigIdToEdit === undefined) {
                    break update_existing_config;
                }

                const s3Config = s3Configs.find(
                    s3Config => s3Config.id === s3ConfigIdToEdit
                );

                assert(s3Config !== undefined);
                assert(s3Config.origin === "project");

                dispatch(
                    actions.initialized({
                        s3ConfigIdToEdit,
                        initialFormValues: {
                            friendlyName: s3Config.friendlyName,
                            url: s3Config.paramsOfCreateS3Client.url,
                            region: s3Config.region,
                            workingDirectoryPath: s3Config.workingDirectoryPath,
                            pathStyleAccess:
                                s3Config.paramsOfCreateS3Client.pathStyleAccess,
                            ...(() => {
                                if (
                                    s3Config.paramsOfCreateS3Client.credentials ===
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
                                        s3Config.paramsOfCreateS3Client.credentials
                                            .accessKeyId,
                                    secretAccessKey:
                                        s3Config.paramsOfCreateS3Client.credentials
                                            .secretAccessKey,
                                    sessionToken:
                                        s3Config.paramsOfCreateS3Client.credentials
                                            .sessionToken
                                };
                            })()
                        }
                    })
                );

                return;
            }

            const { s3ConfigCreationFormDefaults } =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());

            if (s3ConfigCreationFormDefaults === undefined) {
                dispatch(
                    actions.initialized({
                        s3ConfigIdToEdit: undefined,
                        initialFormValues: {
                            friendlyName: "",
                            url: "",
                            region: undefined,
                            workingDirectoryPath: "",
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

            const workingDirectoryPath =
                s3ConfigCreationFormDefaults.workingDirectory === undefined
                    ? undefined
                    : getWorkingDirectoryPath({
                          context: (() => {
                              const project =
                                  projectManagement.protectedSelectors.currentProject(
                                      getState()
                                  );
                              const { isUserLoggedIn, user } =
                                  userAuthentication.selectors.main(getState());

                              assert(isUserLoggedIn);

                              return project.group === undefined
                                  ? {
                                        type: "personalProject" as const,
                                        username: user.username
                                    }
                                  : {
                                        type: "groupProject" as const,
                                        projectGroup: project.group
                                    };
                          })(),
                          workingDirectory: s3ConfigCreationFormDefaults.workingDirectory
                      });

            dispatch(
                actions.initialized({
                    s3ConfigIdToEdit: undefined,
                    initialFormValues: {
                        friendlyName: "",
                        url: s3ConfigCreationFormDefaults.url,
                        region: s3ConfigCreationFormDefaults.region,
                        workingDirectoryPath: workingDirectoryPath ?? "",
                        pathStyleAccess:
                            s3ConfigCreationFormDefaults.pathStyleAccess ?? false,
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

            const projectS3Config =
                privateSelectors.submittableFormValuesAsProjectS3Config(getState());

            assert(projectS3Config !== null);
            assert(projectS3Config !== undefined);

            await dispatch(
                s3ConfigManagement.protectedThunks.createS3Config({
                    projectS3Config
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
        },
    testConnection:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const projectS3Config =
                privateSelectors.submittableFormValuesAsProjectS3Config(getState());

            assert(projectS3Config !== null);
            assert(projectS3Config !== undefined);

            await dispatch(
                s3ConfigConnectionTest.protectedThunks.testS3Connection({
                    paramsOfCreateS3Client: {
                        isStsEnabled: false,
                        url: projectS3Config.url,
                        pathStyleAccess: projectS3Config.pathStyleAccess,
                        region: projectS3Config.region,
                        credentials: projectS3Config.credentials
                    },
                    workingDirectoryPath: projectS3Config.workingDirectoryPath
                })
            );
        }
} satisfies Thunks;
