import type { Thunks } from "core/bootstrap";
import { actions, type State, ChangeValueParams } from "./state";
import { assert } from "tsafe/assert";
import { privateSelectors } from "./selectors";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import { testS3CustomConfigConnection } from "core/usecases/s3ConfigManagement/utils/testS3CustomConfigConnection";

export const thunks = {
    "initialize":
        (params: { customConfigIndex: number | undefined }) =>
        (...args) => {
            const { customConfigIndex } = params;

            const [dispatch, getState] = args;

            update_existing_config: {
                if (customConfigIndex === undefined) {
                    break update_existing_config;
                }

                const projectS3Config =
                    s3ConfigManagement.protectedSelectors.projectS3Config(getState());

                assert(projectS3Config !== undefined);

                const customS3Config = projectS3Config.customConfigs[customConfigIndex];

                assert(customS3Config !== undefined);

                dispatch(
                    actions.initialized({
                        customConfigIndex,
                        "initialFormValues": {
                            "url": customS3Config.url,
                            "region": customS3Config.region,
                            "workingDirectoryPath": customS3Config.workingDirectoryPath,
                            "pathStyleAccess": customS3Config.pathStyleAccess,
                            "accessKeyId": customS3Config.accessKeyId,
                            "secretAccessKey": customS3Config.secretAccessKey,
                            "accountFriendlyName": customS3Config.accountFriendlyName,
                            "sessionToken": customS3Config.sessionToken
                        }
                    })
                );

                return;
            }

            const baseS3Config =
                s3ConfigManagement.protectedSelectors.baseS3Config(getState());

            dispatch(
                actions.initialized({
                    "customConfigIndex": undefined,
                    "initialFormValues": {
                        "url": baseS3Config?.url ?? "",
                        "region": baseS3Config?.region ?? "",
                        "workingDirectoryPath": baseS3Config?.workingDirectoryPath ?? "",
                        "pathStyleAccess": baseS3Config?.pathStyleAccess ?? false,
                        "accessKeyId": "",
                        "secretAccessKey": "",
                        "accountFriendlyName": "",
                        "sessionToken": undefined
                    }
                })
            );
        },
    "reset":
        () =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.stateResetToNotInitialized());
        },
    "submit":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const customConfigIndex = privateSelectors.customConfigIndex(getState());

            const submittableFormValues =
                privateSelectors.submittableFormValues(getState());

            assert(submittableFormValues !== undefined);

            const connectionTestStatus =
                privateSelectors.connectionTestStatus(getState());

            assert(connectionTestStatus !== undefined);

            await dispatch(
                s3ConfigManagement.protectedThunks.addOrUpdateCustomS3Config({
                    customConfigIndex,
                    "customS3Config": {
                        "url": submittableFormValues.url,
                        "region": submittableFormValues.region,
                        "workingDirectoryPath":
                            submittableFormValues.workingDirectoryPath,
                        "pathStyleAccess": submittableFormValues.pathStyleAccess,
                        "accountFriendlyName": submittableFormValues.accountFriendlyName,
                        "accessKeyId": submittableFormValues.accessKeyId,
                        "secretAccessKey": submittableFormValues.secretAccessKey,
                        "sessionToken": submittableFormValues.sessionToken
                    },
                    connectionTestStatus
                })
            );

            dispatch(actions.stateResetToNotInitialized());
        },
    "testConnection":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            dispatch(actions.connectionTestStarted());

            const submittableFormValues =
                privateSelectors.submittableFormValues(getState());

            assert(submittableFormValues !== undefined);

            const result = await testS3CustomConfigConnection({
                "customS3Config": {
                    "url": submittableFormValues.url,
                    "region": submittableFormValues.region,
                    "workingDirectoryPath": submittableFormValues.workingDirectoryPath,
                    "pathStyleAccess": submittableFormValues.pathStyleAccess,
                    "accountFriendlyName": submittableFormValues.accountFriendlyName,
                    "accessKeyId": submittableFormValues.accessKeyId,
                    "secretAccessKey": submittableFormValues.secretAccessKey,
                    "sessionToken": submittableFormValues.sessionToken
                }
            });

            if (result.isSuccess) {
                dispatch(actions.connectionTestSucceeded());
            } else {
                dispatch(actions.connectionTestFailed({ "errorMessage": result.error }));
            }
        },
    "changeValue":
        <K extends keyof State.Ready.FormValues>(params: ChangeValueParams<K>) =>
        async (...args) => {
            const { key, value } = params;

            const [dispatch, getState] = args;
            dispatch(actions.formValueChanged({ key, value }));

            preset_pathStyleAccess: {
                if (key !== "url") {
                    break preset_pathStyleAccess;
                }

                const formValuesErrors = privateSelectors.formValuesErrors(getState());

                assert(formValuesErrors !== undefined);

                if (formValuesErrors.url !== undefined) {
                    break preset_pathStyleAccess;
                }

                const submittableFormValues =
                    privateSelectors.submittableFormValues(getState());

                assert(submittableFormValues !== undefined);

                const { url } = submittableFormValues;

                if (url.toLowerCase().includes("amazonaws.com")) {
                    dispatch(
                        actions.formValueChanged({
                            "key": "pathStyleAccess",
                            "value": false
                        })
                    );
                    break preset_pathStyleAccess;
                }

                if (url.toLocaleLowerCase().includes("minio")) {
                    dispatch(
                        actions.formValueChanged({
                            "key": "pathStyleAccess",
                            "value": true
                        })
                    );
                    break preset_pathStyleAccess;
                }
            }
        }
} satisfies Thunks;
