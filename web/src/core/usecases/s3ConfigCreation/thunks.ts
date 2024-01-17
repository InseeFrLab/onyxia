import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { assert } from "tsafe/assert";
import { protectedSelectors } from "./selectors";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";

export const thunks = {
    "initialize":
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            const stsS3Config = s3ConfigManagement.protectedSelectors.baseS3Config(
                getState()
            );

            dispatch(
                actions.initialized({
                    "initialFormValues": {
                        // NO! This must be read from the region! We can have no STS and still want good defaults.
                        "url": stsS3Config?.url ?? "",
                        "region": stsS3Config?.region ?? "",
                        "workingDirectoryPath": stsS3Config?.workingDirectoryPath ?? "",
                        "pathStyleAccess": stsS3Config?.pathStyleAccess ?? false,
                        "accountFriendlyName": "",
                        "accessKeyId": "",
                        "secretAccessKey": "",
                        "sessionToken": undefined,
                        "isUsedForExplorer": false,
                        "isUsedForXOnyxia": false
                    }
                })
            );

            return {
                "cleanup": () => {
                    dispatch(actions.stateResetToNotInitialized());
                }
            };
        },
    "submit":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const formValues = protectedSelectors.formValues(getState());

            assert(formValues !== undefined);

            await dispatch(
                s3ConfigManagement.protectedThunks.addCustomS3Config({
                    "customS3Config": {
                        "url": formValues.url,
                        "region": formValues.region,
                        "workingDirectoryPath": formValues.workingDirectoryPath,
                        "pathStyleAccess": formValues.pathStyleAccess,
                        "accountFriendlyName": formValues.accountFriendlyName,
                        "accessKeyId": formValues.accessKeyId,
                        "secretAccessKey": formValues.secretAccessKey,
                        "sessionToken": formValues.sessionToken,
                        "isUsedForExplorer": formValues.isUsedForExplorer,
                        "isUsedForXOnyxia": formValues.isUsedForXOnyxia
                    }
                })
            );

            dispatch(actions.stateResetToNotInitialized());
        }
} satisfies Thunks;
