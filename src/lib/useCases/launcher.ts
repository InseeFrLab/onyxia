
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

export const name = "launcher";

export type FormField = {
    path: string[];
    description?: string;
    isReadonly: boolean;
    value: string | boolean;
    /** May only be defined when typeof value is string */
    enum?: string[];
};

export type LauncherState = {
    icon: string | undefined;
    catalogId: string;
    packageName: string;
    formFields: FormField[];
    '~internal': {
        hiddenFormFields: FormField[];
        defaultFormFieldValues: Pick<FormField, "path" | "value">[];
        catalogId: string;
        packageName: string;
    };
    formFieldValuesDifferentFromDefault: Pick<FormField, "path" | "value">[];
    contract?: Record<string, unknown>;
} | null;


const { reducer, actions } = createSlice({
    name,
    "initialState": id<LauncherState>(null),
    "reducers": {
        "initialized": (_, { payload }: PayloadAction<NonNullable<LauncherState>>) =>
            payload,
        "formFieldValueChanged": (state, { payload }: PayloadAction<Pick<FormField, "path" | "value">>) => {

            const { path, value } = payload;

            assert(state !== null);

            state
                .formFields
                .find(formField => same(formField.path, path))!
                .value = value;

            if (
                !!state["~internal"]
                    .defaultFormFieldValues
                    .find(formField => same(formField.path, path))!
                    .value
                !==
                value
            ) {

                const formField = state.formFieldValuesDifferentFromDefault
                    .find(formField => same(formField.path, path));

                if (formField === undefined) {
                    state.formFieldValuesDifferentFromDefault.push({ path, value });
                } else {
                    formField.value = value;
                }

            }

        },
        "contractLoaded": (state, { payload }: PayloadAction<{ contract: Record<string, unknown>; }>) => {
            const { contract } = payload;
            assert(state !== null);
            state.contract = contract;
        },
        "launched": () => null
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

            assert(state !== null);

            const { contract } = await dependencies.onyxiaApiClient.launchPackage({
                "catalogId": state["~internal"].catalogId,
                "packageName": state["~internal"].packageName,
                "options":
                    [
                        ...state.formFields,
                        ...state["~internal"].hiddenFormFields
                    ].reduce<Record<string, unknown>>((launchRequestOptions, formField) => {

                        (function callee(
                            props: {
                                launchRequestOptions: Record<string, unknown>;
                                formField: Pick<FormField, "path" | "value">;
                            }
                        ): void {

                            const { launchRequestOptions, formField } = props;

                            const [key, ...rest] = formField.path

                            if (rest.length === 0) {

                                launchRequestOptions[key] = formField.value;

                            } else {

                                const launchRequestSubOptions = {};

                                launchRequestOptions[key] = launchRequestSubOptions;

                                callee({
                                    "launchRequestOptions": launchRequestSubOptions,
                                    "formField": {
                                        "path": rest,
                                        "value": formField.value
                                    }
                                })

                            }

                        })({
                            launchRequestOptions,
                            formField
                        });

                        return launchRequestOptions

                    }, {}),
                "isDryRun": isForContractPreview
            });

            dispatch(
                isForContractPreview ?
                    actions.contractLoaded({ contract }) :
                    actions.launched()
            );

        },
};

export const thunks = {
    "initialize":
        (
            params: {
                catalogId: string;
                packageName: string;
                formFieldValuesDifferentFromDefault: Pick<FormField, "path" | "value">[];
            }
        ): AppThunk => async (...args) => {

            const {
                catalogId,
                packageName,
                formFieldValuesDifferentFromDefault
            } = params;

            const [dispatch, getState, dependencies] = args;

            //Optimization to save time is nothing has changed
            {

                const launcherState = getState().launcher;

                if (
                    launcherState !== null &&
                    launcherState.catalogId === catalogId &&
                    launcherState.packageName === packageName &&
                    same(
                        launcherState.formFieldValuesDifferentFromDefault,
                        formFieldValuesDifferentFromDefault
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
                        formFields: (FormField & { isHidden: boolean; })[];
                    }
                ): void {

                    const {
                        jsonSchemaObject: { properties },
                        currentPath,
                        formFields
                    } = params;

                    Object.entries(properties).forEach(([key, value]) => {

                        const newCurrentPath = [...currentPath, key];

                        if (value.type === "object") {
                            callee({
                                "currentPath": newCurrentPath,
                                "jsonSchemaObject": value,
                                formFields
                            });
                        } else {
                            formFields.push({
                                "path": newCurrentPath,
                                "description": value.description,
                                "isReadonly": value["x-form"]?.readonly ?? false,
                                "value": value["x-form"]?.value ?? value.default ?? null as any as never,
                                "isHidden": value["x-form"]?.hidden ?? false
                            });
                        }

                    });


                })({
                    "formFields": allFormFields,
                    "currentPath": [],
                    "jsonSchemaObject": getPackageConfigJSONSchemaObjectWithRenderedMustachParams(
                        { mustacheParams }
                    )
                });

                const [formFields, hiddenFormFields] =
                    arrPartition(
                        allFormFields,
                        ({ isHidden }) => !isHidden
                    );


                return { formFields, hiddenFormFields };

            })();

            dispatch(
                actions.initialized({
                    catalogId,
                    packageName,
                    "icon": await dependencies.onyxiaApiClient.getCatalogs()
                        .then(
                            o => o
                                .find(({ id }) => id === catalogId)!
                                .catalog
                                .packages
                                .find(({ name }) => name === packageName)!
                                .icon
                        ),
                    formFields,
                    "~internal": {
                        hiddenFormFields,
                        "defaultFormFieldValues": formFields,
                        catalogId,
                        packageName
                    },
                    "formFieldValuesDifferentFromDefault": []
                })
            );

            formFieldValuesDifferentFromDefault.forEach(
                formFields => dispatch(thunks.changeFormFieldValue(formFields))
            );

        },
    "changeFormFieldValue":
        (
            params: Pick<FormField, "path" | "value">
        ): AppThunk<void> => dispatch => dispatch(actions.formFieldValueChanged(params)),
    "launch":
        (): AppThunk => async dispatch =>
            dispatch(privateThunks.launchOrPreviewContract({ "isForContractPreview": false })),
    "previewContract":
        (): AppThunk => async dispatch =>
            dispatch(privateThunks.launchOrPreviewContract({ "isForContractPreview": true }))
};



