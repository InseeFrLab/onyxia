
import type { AppThunk } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { getPublicIp } from "lib/tools/getPublicIp";
import { assert } from "tsafe/assert";
import { thunks as appConstantsThunks } from "./appConstants";
import { pure as secretExplorerPure } from "./secretExplorer";
import { userConfigsStateToUserConfigs } from "lib/useCases/userConfigs";
import { same } from "evt/tools/inDepth/same";
import { arrPartition } from "evt/tools/reducers/partition";
import { Public_Catalog_CatalogId_PackageName } from "../ports/OnyxiaApiClient";
import { thunks as restorablePackageConfigsThunks  } from "./restorablePackageConfigs";
import type { FormFieldValue } from "./sharedDataModel/FormFieldValue";
import { 
    formFieldsValueToObject, 
} from "./sharedDataModel/FormFieldValue";
import { 
    onyxiaFriendlyNameFormFieldPath,
    areSameRestorablePackageConfig
} from "./restorablePackageConfigs";

export const name = "launcher";

export type FormField = FormFieldValue & {
    title?: string;
    description?: string;
    isReadonly: boolean;
    /** May only be defined when typeof value is string */
    enum?: string[];
};

export type LauncherState =
    LauncherState.NotInitialized |
    LauncherState.Ready;

export declare namespace LauncherState {

    export type NotInitialized = {
        stateDescription: "not initialized";
    };

    export type Ready = {
        stateDescription: "ready";
        icon: string | undefined;
        catalogId: string;
        packageName: string;
        formFields: FormField[];
        '~internal': {
            hiddenFormFields: FormField[];
            defaultFormFieldsValue: FormFieldValue[];
            catalogId: string;
            packageName: string;
        };
        formFieldsValueDifferentFromDefault: FormFieldValue[];
        contract?: Record<string, unknown>;
        isSaved: boolean;
    };

}


const { reducer, actions } = createSlice({
    name,
    "initialState": id<LauncherState>(id<LauncherState.NotInitialized>({
        "stateDescription": "not initialized",
    })),
    "reducers": {
        "initialized": (_, { payload }: PayloadAction<LauncherState.Ready>) =>
            payload,
        "formFieldValueChanged": (state, { payload }: PayloadAction<FormFieldValue>) => {

            const { path, value } = payload;

            assert(state.stateDescription === "ready");

            {

                const formField =
                    [
                        ...state.formFields,
                        ...state["~internal"].hiddenFormFields
                    ]
                        .find(formField => same(formField.path, path))!;

                if (formField.value === value) {
                    return;
                }

                formField.value = value;

            }

            if (
                !!state["~internal"]
                    .defaultFormFieldsValue
                    .find(formField => same(formField.path, path))!
                    .value
                !==
                value
            ) {

                const formField = state.formFieldsValueDifferentFromDefault
                    .find(formField => same(formField.path, path));

                if (formField === undefined) {
                    state.formFieldsValueDifferentFromDefault.push({ path, value });
                } else {
                    formField.value = value;
                }

            } else {

                state.formFieldsValueDifferentFromDefault =
                    state.formFieldsValueDifferentFromDefault
                        .filter(formField => !same(formField.path, path));

            }

        },
        "contractLoaded": (state, { payload }: PayloadAction<{ contract: Record<string, unknown>; }>) => {
            const { contract } = payload;
            assert(state.stateDescription === "ready");
            state.contract = contract;
        },
        "launched": () => id<LauncherState.NotInitialized>({
            "stateDescription": "not initialized",
        }),
        "valueOfIsSavedUpdated": (state, { payload }: PayloadAction<{ isSaved: boolean; }>) => {
            const { isSaved } = payload;
            assert(state.stateDescription === "ready");
            state.isSaved = isSaved;
        }
    }
});

export { reducer };


const privateThunks = {
    "launchOrPreviewContract":
        (
            params: {
                isForContractPreview: boolean;
            }
        ): AppThunk => async (...args) => {

            const { isForContractPreview } = params;

            const [dispatch, getState, dependencies] = args;

            const state = getState().launcher;

            assert(state.stateDescription === "ready");

            const { contract } = await dependencies.onyxiaApiClient.launchPackage({
                "catalogId": state["~internal"].catalogId,
                "packageName": state["~internal"].packageName,
                "options": formFieldsValueToObject([
                    ...state.formFields,
                    ...state["~internal"].hiddenFormFields
                ]),
                "isDryRun": isForContractPreview
            });

            dispatch(
                isForContractPreview ?
                    actions.contractLoaded({ contract }) :
                    actions.launched()
            );

        },
    "updateSavedStatus": (): AppThunk<void> => async (dispatch, getState) =>
        dispatch(actions.valueOfIsSavedUpdated({
            "isSaved": dispatch(
                restorablePackageConfigsThunks.isRestorablePackageConfigAlreadyInStore({
                    "restorablePackageConfig": (() => {
                        const state = getState().launcher;
                        assert(state.stateDescription === "ready");
                        return state;
                    })()
                })
            )
        }))

};

export const thunks = {
    "initialize":
        (
            params: {
                catalogId: string;
                packageName: string;
                formFieldsValueDifferentFromDefault: FormFieldValue[];
            }
        ): AppThunk => async (...args) => {

            const {
                catalogId,
                packageName,
                formFieldsValueDifferentFromDefault
            } = params;

            const [dispatch, getState, dependencies] = args;

            //Optimization to save time is nothing has changed
            {

                const launcherState = getState().launcher;

                if (
                    launcherState.stateDescription === "ready" &&
                    areSameRestorablePackageConfig(
                        launcherState,
                        params
                    )
                ) {
                    return;
                }

            }


            const { getPackageConfigJSONSchemaObjectWithRenderedMustachParams } =
                await dependencies.onyxiaApiClient
                    .getPackageConfigJSONSchemaObjectWithRenderedMustachParamsFactory({
                        catalogId,
                        packageName
                    });

            assert(dependencies.oidcClient.isUserLoggedIn);

            //TODO: Renew VAULT and MINIO token

            const { mustacheParams } = await (async () => {

                const publicIp = await getPublicIp();

                const { vaultToken } = getState().tokens;

                //TODO: Fetch first
                const s3 = getState().user.s3!;

                const appConstants =
                    dispatch(appConstantsThunks.getAppConstants());

                assert(appConstants.isUserLoggedIn);

                const {
                    parsedJwt,
                    vaultClientConfig
                } = appConstants;

                const secretExplorerUserHomePath =
                    secretExplorerPure.getUserHomePath(
                        { "preferred_username": parsedJwt.preferred_username }
                    );

                const userConfigs = userConfigsStateToUserConfigs(
                    getState().userConfigs
                );

                const mustacheParams: Public_Catalog_CatalogId_PackageName.MustacheParams = {
                    "user": {
                        "idep": parsedJwt.preferred_username,
                        "name": `${parsedJwt.family_name} ${parsedJwt.given_name}`,
                        "email": parsedJwt.email,
                        "password": userConfigs.userServicePassword,
                        "ip": publicIp,
                    },
                    "git": {
                        "name": userConfigs.gitName,
                        "email": userConfigs.gitEmail,
                        "credentials_cache_duration": userConfigs.gitCredentialCacheDuration
                    },
                    "vault": {
                        "VAULT_ADDR": vaultClientConfig.baseUri,
                        "VAULT_TOKEN": vaultToken,
                        "VAULT_MOUNT": vaultClientConfig.engine,
                        "VAULT_TOP_DIR": secretExplorerUserHomePath
                    },
                    "kaggleApiToken": userConfigs.kaggleApiToken,
                    "s3": {
                        ...s3,
                        "AWS_BUCKET_NAME": parsedJwt.preferred_username
                    }
                };

                return { mustacheParams };

            })();

            const { formFields, hiddenFormFields } = (() => {

                const allFormFields: (FormField & { isHidden: boolean; })[] = [];

                (function callee(
                    params: {
                        jsonSchemaObject: Public_Catalog_CatalogId_PackageName.JSONSchemaObject;
                        currentPath: string[];
                    }
                ): void {

                    const {
                        jsonSchemaObject: { properties },
                        currentPath
                    } = params;

                    Object.entries(properties).forEach(([key, value]) => {

                        const newCurrentPath = [...currentPath, key];

                        if (value.type === "object") {
                            callee({
                                "currentPath": newCurrentPath,
                                "jsonSchemaObject": value,
                            });
                        } else {
                            allFormFields.push({
                                "path": newCurrentPath,
                                "title": value.title,
                                "description": value.description,
                                "isReadonly": value["x-form"]?.readonly ?? false,
                                "value": value["x-form"]?.value ?? value.default ?? null as any as never,
                                "isHidden": value["x-form"]?.hidden ?? false
                            });
                        }

                    });

                })({
                    "currentPath": [],
                    "jsonSchemaObject": getPackageConfigJSONSchemaObjectWithRenderedMustachParams(
                        { mustacheParams }
                    )
                });

                const [hiddenFormFields, formFields] =
                    arrPartition(
                        allFormFields,
                        ({ isHidden, path }) =>
                            isHidden ||
                            same(onyxiaFriendlyNameFormFieldPath, path)
                    );


                return { formFields, hiddenFormFields };

            })();

            dispatch(
                actions.initialized({
                    "stateDescription": "ready",
                    catalogId,
                    packageName,
                    "icon": await dependencies.onyxiaApiClient.getCatalogs()
                        .then(
                            apiRequestResult => apiRequestResult
                                .find(({ id }) => id === catalogId)!
                                .catalog
                                .packages
                                .find(({ name }) => name === packageName)!
                                .icon
                        ),
                    formFields,
                    "~internal": {
                        hiddenFormFields,
                        "defaultFormFieldsValue": formFields,
                        catalogId,
                        packageName
                    },
                    "formFieldsValueDifferentFromDefault": [],
                    "isSaved": false
                })
            );

            formFieldsValueDifferentFromDefault.forEach(
                formFields => dispatch(thunks.changeFormFieldValue(formFields))
            );

            dispatch(privateThunks.updateSavedStatus());

        },
    "changeFormFieldValue":
        (
            params: FormFieldValue
        ): AppThunk<void> => dispatch => { 
            dispatch(actions.formFieldValueChanged(params)); 
            dispatch(privateThunks.updateSavedStatus());
        },
    "launch":
        (): AppThunk => async dispatch =>
            dispatch(privateThunks.launchOrPreviewContract({ "isForContractPreview": false })),
    "previewContract":
        (): AppThunk => async dispatch =>
            dispatch(privateThunks.launchOrPreviewContract({ "isForContractPreview": true })),
    "changeFriendlyName":
        (
            friendlyName: string
        ): AppThunk<void> => dispatch => dispatch(thunks.changeFormFieldValue({
            "path": onyxiaFriendlyNameFormFieldPath,
            "value": friendlyName
        })),
    /** Extracted from ~internal state, we avoid duplication */
    "getFriendlyName":
        (): AppThunk<string> => (...args) => {
            const [, getState] = args;
            const state = getState().launcher;
            assert(state.stateDescription === "ready");
            const friendlyName = state["~internal"]
                .hiddenFormFields
                .find(({ path }) => same(path, onyxiaFriendlyNameFormFieldPath))!
                .value;
            assert(typeof friendlyName !== "boolean");
            return friendlyName;
        },
    "saveConfiguration":
        (): AppThunk => (dispatch, getState) =>
            dispatch(restorablePackageConfigsThunks.saveRestorablePackageConfig({
                "restorablePackageConfig": (() => {

                    const state = getState().launcher;

                    assert(state.stateDescription === "ready");

                    return state;

                })()
            }))
};
