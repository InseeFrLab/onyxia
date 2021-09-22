import "minimal-polyfills/Object.fromEntries";
import type { AppThunk } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { thunks as appConstantsThunks } from "./appConstants";
import { pure as secretExplorerPure } from "./secretExplorer";
import { userConfigsStateToUserConfigs } from "lib/useCases/userConfigs";
import { same } from "evt/tools/inDepth/same";
import { Get_Public_Catalog_CatalogId_PackageName } from "../ports/OnyxiaApiClient";
import type { FormFieldValue } from "./sharedDataModel/FormFieldValue";
import { formFieldsValueToObject } from "./sharedDataModel/FormFieldValue";
import { onyxiaFriendlyNameFormFieldPath } from "lib/ports/OnyxiaApiClient";
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../setup";
import type { RestorablePackageConfig } from "./restorablePackageConfigs";
import type { WritableDraft } from "immer/dist/types/types-external";
import { getMinioToken } from "js/minio-client/minio-client";
import { Put_MyLab_App } from "../ports/OnyxiaApiClient";
import { thunks as publicIpThunks } from "./publicIp";
import { exclude } from "tsafe/exclude";

export const name = "launcher";

export type FormField =
    | FormField.Boolean
    | FormField.Integer
    | FormField.Enum
    | FormField.Text
    | FormField.Slider;
export declare namespace FormField {
    type Common = {
        path: string[];
        title: string;
        description: string | undefined;
        isReadonly: boolean;
    };

    export type Boolean = Common & {
        type: "boolean";
        value: boolean;
    };

    export type Integer = Common & {
        type: "integer";
        value: number;
        minimum: number | undefined;
    };

    export type Enum<T extends string = string> = Common & {
        type: "enum";
        enum: T[];
        value: T;
    };

    export type Text = Common & {
        type: "text";
        pattern: string | undefined;
        value: string;
        defaultValue: string;
    };

    export type Slider = Slider.Simple | Slider.Range;

    export namespace Slider {
        type SliderCommon<Unit extends string> = Common & {
            type: "slider";
            value: `${number}${Unit}`;
        };

        export type Simple<Unit extends string = string> = SliderCommon<Unit> & {
            sliderVariation: "simple";
            sliderMax: number;
            sliderMin: number;
            sliderUnit: Unit;
            sliderStep: number;
        };

        export type Range = Range.Down | Range.Up;
        export namespace Range {
            type RangeCommon<Unit extends string> = SliderCommon<Unit> & {
                sliderVariation: "range";
                sliderExtremitySemantic: string;
                sliderRangeId: string;
            };

            export type Down<Unit extends string = string> = RangeCommon<Unit> & {
                sliderExtremity: "down";
                sliderMin: number;
                sliderUnit: Unit;
                sliderStep: number;
            };

            export type Up<Unit extends string = string> = RangeCommon<Unit> & {
                sliderExtremity: "up";
                sliderMax: number;
            };
        }
    }
}

export type LauncherState = LauncherState.NotInitialized | LauncherState.Ready;

export declare namespace LauncherState {
    export type NotInitialized = {
        stateDescription: "not initialized";
    };

    export type Ready = {
        stateDescription: "ready";
        icon: string | undefined;
        catalogId: string;
        packageName: string;
        sources: string[];
        "~internal": {
            pathOfFormFieldsWhoseValuesAreDifferentFromDefault: {
                path: string[];
            }[];
            formFields: FormField[];
            infosAboutWhenFieldsShouldBeHidden: {
                path: string[];
                isHidden: boolean | FormFieldValue;
            }[];
            defaultFormFieldsValue: FormFieldValue[];
            dependencies?: string[];
            config: Get_Public_Catalog_CatalogId_PackageName["config"];
        };
        launchState: "not launching" | "launching" | "launched";
    };
}

export type IndexedFormFields = IndexedFormFields.Final;

export declare namespace IndexedFormFields {
    type Generic<T> = {
        [dependencyNamePackageNameOrGlobal: string]: {
            meta:
                | {
                      type: "dependency";
                  }
                | {
                      type: "package";
                  }
                | {
                      type: "global";
                      description?: string;
                  };
            formFieldsByTabName: {
                [tabName: string]: { description?: string } & T;
            };
        };
    };

    export type Final = Generic<{
        formFields: Exclude<FormField, FormField.Slider.Range>[];
        assembledSliderRangeFormFields: AssembledSliderRangeFormField[];
    }>;

    export type Scaffolding = Generic<{
        formFields: FormField[];
    }>;

    export type AssembledSliderRangeFormField<Unit extends string = string> = {
        title: string;
        description?: string;
        sliderMax: number;
        sliderMin: number;
        sliderUnit: Unit;
        sliderStep: number;
        extremities: Record<
            "up" | "down",
            {
                path: string[];
                semantic: string;
                value: `${number}${Unit}`;
            }
        >;
    };
}

const { scaffoldingIndexedFormFieldsToFinal } = (() => {
    const { assembleFormFields } = (() => {
        const { assembleRangeSliderFormField } = (() => {
            const { assembleExtremities } = (() => {
                function toExtremities(
                    formField: FormField.Slider.Range,
                ): IndexedFormFields.AssembledSliderRangeFormField["extremities"][
                    | "up"
                    | "down"] {
                    return {
                        "path": formField.path,
                        "semantic": formField.sliderExtremitySemantic,
                        "value": formField.value,
                    };
                }

                function assembleExtremities(
                    formField1: FormField.Slider.Range,
                    formField2: FormField.Slider.Range,
                ): IndexedFormFields.AssembledSliderRangeFormField {
                    const formFieldUp =
                        formField1.sliderExtremity === "up" ? formField1 : formField2;

                    assert(formFieldUp.sliderExtremity === "up");

                    const formFieldDown = [formField1, formField2].find(
                        formField => formField !== formFieldUp,
                    );

                    assert(
                        formFieldDown !== undefined &&
                            formFieldDown.sliderExtremity === "down",
                    );

                    return {
                        "extremities": {
                            "down": toExtremities(formFieldDown),
                            "up": toExtremities(formFieldUp),
                        },
                        "sliderMax": formFieldUp.sliderMax,
                        ...formFieldDown,
                    };
                }

                return { assembleExtremities };
            })();

            function assembleRangeSliderFormField(
                acc: (
                    | IndexedFormFields.AssembledSliderRangeFormField
                    | FormField.Slider.Range
                )[],
                formField: FormField.Slider.Range,
            ): void {
                const otherExtremity = acc
                    .map(assembledSliderRangeFormFieldOrFormFieldSliderRange =>
                        "extremities" in
                        assembledSliderRangeFormFieldOrFormFieldSliderRange
                            ? undefined
                            : assembledSliderRangeFormFieldOrFormFieldSliderRange,
                    )
                    .filter(exclude(undefined))
                    .find(
                        ({ sliderRangeId }) => sliderRangeId === formField.sliderRangeId,
                    );

                if (otherExtremity !== undefined) {
                    acc[acc.indexOf(otherExtremity)] = assembleExtremities(
                        otherExtremity,
                        formField,
                    );
                } else {
                    acc.push(formField);
                }
            }

            return { assembleRangeSliderFormField };
        })();

        function assembleFormFields(
            formFields: FormField.Slider.Range[],
        ): IndexedFormFields.AssembledSliderRangeFormField[] {
            let acc: (
                | IndexedFormFields.AssembledSliderRangeFormField
                | FormField.Slider.Range
            )[] = [];

            formFields.forEach(formField => assembleRangeSliderFormField(acc, formField));

            return acc.map(assembledSliderRangeFormField => {
                if (!("extremities" in assembledSliderRangeFormField)) {
                    throw new Error(
                        `${assembledSliderRangeFormField.path.join("/")} only has ${
                            assembledSliderRangeFormField.sliderExtremity
                        } extremity`,
                    );
                }
                return assembledSliderRangeFormField;
            });
        }

        return { assembleFormFields };
    })();

    function scaffoldingIndexedFormFieldsToFinal(
        scaffoldingIndexedFormFields: IndexedFormFields.Scaffolding,
    ): IndexedFormFields.Final {
        const indexedFormFields: IndexedFormFields.Final = {};

        Object.entries(scaffoldingIndexedFormFields).forEach(
            ([
                dependencyNamePackageNameOrGlobal,
                { meta, formFieldsByTabName: scaffoldingFormFieldsByTabName },
            ]) => {
                const formFieldsByTabName: IndexedFormFields.Final[string]["formFieldsByTabName"] =
                    {};

                Object.entries(scaffoldingFormFieldsByTabName).forEach(
                    ([tabName, { description, formFields: allFormFields }]) => {
                        const nonSliderRangeFormFields: Exclude<
                            FormField,
                            FormField.Slider.Range
                        >[] = [];
                        const sliderRangeFormFields: FormField.Slider.Range[] = [];

                        allFormFields.forEach(formField => {
                            if (
                                formField.type === "slider" &&
                                formField.sliderVariation === "range"
                            ) {
                                sliderRangeFormFields.push(formField);
                            } else {
                                nonSliderRangeFormFields.push(formField);
                            }
                        });

                        formFieldsByTabName[tabName] = {
                            description,
                            "formFields": nonSliderRangeFormFields,
                            "assembledSliderRangeFormFields":
                                assembleFormFields(sliderRangeFormFields),
                        };
                    },
                );

                indexedFormFields[dependencyNamePackageNameOrGlobal] = {
                    meta,
                    formFieldsByTabName,
                };
            },
        );

        return indexedFormFields;
    }

    return { scaffoldingIndexedFormFieldsToFinal };
})();

const { reducer, actions } = createSlice({
    name,
    "initialState": id<LauncherState>(
        id<LauncherState.NotInitialized>({
            "stateDescription": "not initialized",
        }),
    ),
    "reducers": {
        "initialized": (
            state,
            {
                payload,
            }: PayloadAction<{
                catalogId: string;
                packageName: string;
                icon: string | undefined;
                sources: string[];
                formFields: LauncherState.Ready["~internal"]["formFields"];
                infosAboutWhenFieldsShouldBeHidden: LauncherState.Ready["~internal"]["infosAboutWhenFieldsShouldBeHidden"];
                config: LauncherState.Ready["~internal"]["config"];
                dependencies: string[];
                formFieldsValueDifferentFromDefault: FormFieldValue[];
            }>,
        ) => {
            const {
                catalogId,
                packageName,
                icon,
                sources,
                formFields,
                infosAboutWhenFieldsShouldBeHidden,
                config,
                dependencies,
                formFieldsValueDifferentFromDefault,
            } = payload;

            Object.assign(
                state,
                id<LauncherState.Ready>({
                    "stateDescription": "ready",
                    catalogId,
                    packageName,
                    icon,
                    sources,
                    "~internal": {
                        formFields,
                        infosAboutWhenFieldsShouldBeHidden,
                        "defaultFormFieldsValue": formFields.map(({ path, value }) => ({
                            path,
                            value,
                        })),
                        dependencies,
                        "pathOfFormFieldsWhoseValuesAreDifferentFromDefault": [],
                        config,
                    },
                    "launchState": "not launching",
                }),
            );

            assert(state.stateDescription === "ready");

            formFieldsValueDifferentFromDefault.forEach(formFieldValue =>
                formFieldValueChangedReducer({ state, formFieldValue }),
            );
        },
        "reset": () =>
            id<LauncherState.NotInitialized>({
                "stateDescription": "not initialized",
            }),
        "formFieldValueChanged": (state, { payload }: PayloadAction<FormFieldValue>) => {
            assert(state.stateDescription === "ready");

            formFieldValueChangedReducer({ state, "formFieldValue": payload });
        },
        "launchStarted": state => {
            assert(state.stateDescription === "ready");
            state.launchState = "launching";
        },
        "launchCompleted": state => {
            assert(state.stateDescription === "ready");
            state.launchState = "launched";
        },
    },
});

export { reducer };

const privateThunks = {
    "launchOrPreviewContract":
        (params: {
            isForContractPreview: boolean;
        }): AppThunk<Promise<{ contract: Put_MyLab_App }>> =>
        async (...args) => {
            const { isForContractPreview } = params;

            const [dispatch, getState, { onyxiaApiClient }] = args;

            if (!isForContractPreview) {
                dispatch(actions.launchStarted());
            }

            const state = getState().launcher;

            assert(state.stateDescription === "ready");

            const { contract } = await onyxiaApiClient.launchPackage({
                "catalogId": state.catalogId,
                "packageName": state.packageName,
                "options": formFieldsValueToObject(state["~internal"].formFields),
                "isDryRun": isForContractPreview,
            });

            if (!isForContractPreview) {
                dispatch(actions.launchCompleted());
            }

            return { contract };
        },
};

export const thunks = {
    "initialize":
        (params: {
            catalogId: string;
            packageName: string;
            formFieldsValueDifferentFromDefault: FormFieldValue[];
        }): AppThunk =>
        async (...args) => {
            const { catalogId, packageName, formFieldsValueDifferentFromDefault } =
                params;

            const [dispatch, getState, { onyxiaApiClient, oidcClient }] = args;

            assert(
                getState().launcher.stateDescription === "not initialized",
                "the reset thunk need to be called before initializing again",
            );

            const {
                getPackageConfigJSONSchemaObjectWithRenderedMustachParams,
                dependencies,
                sources,
            } = await onyxiaApiClient.getPackageConfigJSONSchemaObjectWithRenderedMustachParamsFactory(
                {
                    catalogId,
                    packageName,
                },
            );

            assert(oidcClient.isUserLoggedIn);

            //TODO: Renew VAULT and MINIO token

            const { mustacheParams } = await (async () => {
                const { publicIp } = await dispatch(publicIpThunks.fetch());

                const { vaultToken } = getState().tokens;

                await getMinioToken();

                const s3 = getState().user.s3!;

                const appConstants = dispatch(appConstantsThunks.getAppConstants());

                assert(appConstants.isUserLoggedIn);

                const { parsedJwt, vaultClientConfig } = appConstants;

                const secretExplorerUserHomePath = secretExplorerPure.getUserHomePath({
                    "username": parsedJwt.username,
                });

                const userConfigs = userConfigsStateToUserConfigs(getState().userConfigs);

                const mustacheParams: Get_Public_Catalog_CatalogId_PackageName.MustacheParams =
                    {
                        "user": {
                            "idep": parsedJwt.username,
                            "name": `${parsedJwt.familyName} ${parsedJwt.firstName}`,
                            "email": parsedJwt.email,
                            "password": userConfigs.userServicePassword,
                            "ip": publicIp,
                        },
                        "project": {
                            "id": parsedJwt.username,
                            "password": userConfigs.userServicePassword,
                        },
                        "git": {
                            "name": userConfigs.gitName,
                            "email": userConfigs.gitEmail,
                            "credentials_cache_duration":
                                userConfigs.gitCredentialCacheDuration,
                            "token": userConfigs.githubPersonalAccessToken,
                        },
                        "vault": {
                            "VAULT_ADDR": vaultClientConfig.baseUri,
                            "VAULT_TOKEN": vaultToken,
                            "VAULT_MOUNT": vaultClientConfig.engine,
                            "VAULT_TOP_DIR": secretExplorerUserHomePath,
                        },
                        "kaggleApiToken": userConfigs.kaggleApiToken,
                        "s3": {
                            ...s3,
                            "AWS_BUCKET_NAME": parsedJwt.username,
                        },
                    };

                return { mustacheParams };
            })();

            const config = getPackageConfigJSONSchemaObjectWithRenderedMustachParams({
                mustacheParams,
            });

            const { formFields, infosAboutWhenFieldsShouldBeHidden } = (() => {
                const formFields: LauncherState.Ready["~internal"]["formFields"] = [];
                const infosAboutWhenFieldsShouldBeHidden: LauncherState.Ready["~internal"]["infosAboutWhenFieldsShouldBeHidden"] =
                    [];

                (function callee(params: {
                    jsonSchemaObject: Get_Public_Catalog_CatalogId_PackageName.JSONSchemaObject;
                    currentPath: string[];
                }): void {
                    const {
                        jsonSchemaObject: { properties },
                        currentPath,
                    } = params;

                    Object.entries(properties).forEach(
                        ([key, jsonSchemaObjectOrFormFieldDescription]) => {
                            const newCurrentPath = [...currentPath, key];

                            if (
                                jsonSchemaObjectOrFormFieldDescription.type === "object"
                            ) {
                                const jsonSchemaObject =
                                    jsonSchemaObjectOrFormFieldDescription;

                                callee({
                                    "currentPath": newCurrentPath,
                                    jsonSchemaObject,
                                });
                                return;
                            }

                            const jsonSchemaFormFieldDescription =
                                jsonSchemaObjectOrFormFieldDescription;

                            formFields.push(
                                (() => {
                                    const common = {
                                        "path": newCurrentPath,
                                        "title":
                                            jsonSchemaFormFieldDescription.title ??
                                            newCurrentPath.slice(-1)[0],
                                        "description":
                                            jsonSchemaFormFieldDescription.description,
                                        "isReadonly":
                                            jsonSchemaFormFieldDescription["x-form"]
                                                ?.readonly ?? false,
                                    };

                                    const getDefaultValue = <
                                        T extends Get_Public_Catalog_CatalogId_PackageName.JSONSchemaFormFieldDescription,
                                    >(
                                        jsonSchemaFormFieldDescription: T,
                                    ): NonNullable<
                                        NonNullable<T["x-form"]>["value"] | T["default"]
                                    > =>
                                        jsonSchemaFormFieldDescription["x-form"]?.value ??
                                        jsonSchemaFormFieldDescription.default ??
                                        ((): any => {
                                            switch (jsonSchemaFormFieldDescription.type) {
                                                case "string":
                                                    return "";
                                                case "boolean":
                                                    return false;
                                                case "number":
                                                    return 0;
                                            }
                                        })();

                                    if ("render" in jsonSchemaFormFieldDescription) {
                                        assert(
                                            jsonSchemaFormFieldDescription.render ===
                                                "slider",
                                            `${common.path.join("/")} has render: "${
                                                jsonSchemaFormFieldDescription.render
                                            }" and it's not supported`,
                                        );

                                        const value = getDefaultValue(
                                            jsonSchemaFormFieldDescription,
                                        );

                                        if (
                                            "sliderExtremity" in
                                            jsonSchemaFormFieldDescription
                                        ) {
                                            const scopCommon = {
                                                ...common,
                                                "type": "slider",
                                                "sliderVariation": "range",
                                            } as const;

                                            switch (
                                                jsonSchemaFormFieldDescription.sliderExtremity
                                            ) {
                                                case "down":
                                                    return id<FormField.Slider.Range.Down>(
                                                        {
                                                            ...scopCommon,
                                                            "sliderExtremitySemantic":
                                                                jsonSchemaFormFieldDescription.sliderExtremitySemantic,
                                                            "sliderRangeId":
                                                                jsonSchemaFormFieldDescription.sliderRangeId,
                                                            "sliderExtremity": "down",
                                                            "sliderMin":
                                                                jsonSchemaFormFieldDescription.sliderMin,
                                                            "sliderUnit":
                                                                jsonSchemaFormFieldDescription.sliderUnit,
                                                            "sliderStep":
                                                                jsonSchemaFormFieldDescription.sliderStep,
                                                            value,
                                                        },
                                                    );
                                                case "up":
                                                    return id<FormField.Slider.Range.Up>({
                                                        ...scopCommon,
                                                        "sliderExtremitySemantic":
                                                            jsonSchemaFormFieldDescription.sliderExtremitySemantic,
                                                        "sliderRangeId":
                                                            jsonSchemaFormFieldDescription.sliderRangeId,
                                                        "sliderExtremity": "up",
                                                        "sliderMax":
                                                            jsonSchemaFormFieldDescription.sliderMax,
                                                        value,
                                                    });
                                            }
                                        }

                                        return id<FormField.Slider.Simple>({
                                            ...common,
                                            "type": "slider",
                                            "sliderVariation": "simple",
                                            "sliderMin":
                                                jsonSchemaFormFieldDescription.sliderMin,
                                            "sliderUnit":
                                                jsonSchemaFormFieldDescription.sliderUnit,
                                            "sliderStep":
                                                jsonSchemaFormFieldDescription.sliderStep,
                                            "sliderMax":
                                                jsonSchemaFormFieldDescription.sliderMax,
                                            value,
                                        });
                                    }

                                    if (
                                        jsonSchemaFormFieldDescription.type === "boolean"
                                    ) {
                                        return id<FormField.Boolean>({
                                            ...common,
                                            "value": getDefaultValue(
                                                jsonSchemaFormFieldDescription,
                                            ),
                                            "type": "boolean",
                                        });
                                    }

                                    if (
                                        jsonSchemaFormFieldDescription.type === "number"
                                    ) {
                                        return id<FormField.Integer>({
                                            ...common,
                                            "value": getDefaultValue(
                                                jsonSchemaFormFieldDescription,
                                            ),
                                            "minimum":
                                                jsonSchemaFormFieldDescription.minimum,
                                            "type": "integer",
                                        });
                                    }

                                    if ("enum" in jsonSchemaFormFieldDescription) {
                                        return id<FormField.Enum>({
                                            ...common,
                                            "value": getDefaultValue(
                                                jsonSchemaFormFieldDescription,
                                            ),
                                            "enum": jsonSchemaFormFieldDescription.enum,
                                            "type": "enum",
                                        });
                                    }

                                    const value = getDefaultValue(
                                        jsonSchemaFormFieldDescription,
                                    );

                                    return id<FormField.Text>({
                                        ...common,
                                        "pattern": jsonSchemaFormFieldDescription.pattern,
                                        value,
                                        "type": "text",
                                        "defaultValue": value,
                                    });
                                })(),
                            );

                            infosAboutWhenFieldsShouldBeHidden.push({
                                "path": newCurrentPath,
                                "isHidden": (() => {
                                    const { hidden } = jsonSchemaFormFieldDescription;

                                    if (hidden === undefined) {
                                        const hidden =
                                            jsonSchemaFormFieldDescription["x-form"]
                                                ?.hidden;

                                        if (hidden !== undefined) {
                                            return hidden;
                                        }

                                        return false;
                                    }

                                    if (typeof hidden === "boolean") {
                                        return hidden;
                                    }

                                    return {
                                        "path": hidden.path.split("/"),
                                        "value": hidden.value,
                                    };
                                })(),
                            });
                        },
                    );
                })({
                    "currentPath": [],
                    "jsonSchemaObject": config,
                });

                return { formFields, infosAboutWhenFieldsShouldBeHidden };
            })();

            dispatch(
                actions.initialized({
                    catalogId,
                    packageName,
                    "icon": await onyxiaApiClient
                        .getCatalogs()
                        .then(
                            apiRequestResult =>
                                apiRequestResult
                                    .find(({ id }) => id === catalogId)!
                                    .catalog.packages.find(
                                        ({ name }) => name === packageName,
                                    )!.icon,
                        ),
                    "sources": sources ?? [],
                    formFields,
                    infosAboutWhenFieldsShouldBeHidden,
                    config,
                    "dependencies": dependencies
                        .filter(({ enabled }) => enabled)
                        .map(({ name }) => name),
                    formFieldsValueDifferentFromDefault,
                }),
            );
        },
    "reset": (): AppThunk<void> => dispatch => dispatch(actions.reset()),
    "changeFormFieldValue":
        (params: FormFieldValue): AppThunk<void> =>
        dispatch =>
            dispatch(actions.formFieldValueChanged(params)),
    "launch": (): AppThunk => async dispatch => {
        dispatch(
            privateThunks.launchOrPreviewContract({
                "isForContractPreview": false,
            }),
        );
    },
    "getContract": (): AppThunk<Promise<{ contract: Put_MyLab_App }>> => async dispatch =>
        dispatch(
            privateThunks.launchOrPreviewContract({
                "isForContractPreview": true,
            }),
        ),
    "changeFriendlyName":
        (friendlyName: string): AppThunk<void> =>
        dispatch =>
            dispatch(
                thunks.changeFormFieldValue({
                    "path": onyxiaFriendlyNameFormFieldPath,
                    "value": friendlyName,
                }),
            ),
};

export const selectors = (() => {
    const readyLauncherSelector = (
        rootState: RootState,
    ): LauncherState.Ready | undefined => {
        const state = rootState.launcher;
        switch (state.stateDescription) {
            case "ready":
                return state;
            default:
                return undefined;
        }
    };

    const packageNameSelector = createSelector(
        readyLauncherSelector,
        state => state?.packageName,
    );

    const formFieldsSelector = createSelector(
        readyLauncherSelector,
        state => state?.["~internal"].formFields,
    );

    const infosAboutWhenFieldsShouldBeHiddenSelector = createSelector(
        readyLauncherSelector,
        state => state?.["~internal"].infosAboutWhenFieldsShouldBeHidden,
    );

    const dependenciesSelector = createSelector(
        readyLauncherSelector,
        state => state?.["~internal"].dependencies,
    );

    const friendlyNameSelector = createSelector(formFieldsSelector, formFields => {
        if (formFields === undefined) {
            return undefined;
        }

        const friendlyName = formFields.find(({ path }) =>
            same(path, onyxiaFriendlyNameFormFieldPath),
        )!.value;

        assert(typeof friendlyName === "string");

        return friendlyName;
    });

    const configSelector = createSelector(
        readyLauncherSelector,
        state => state?.["~internal"].config,
    );

    function createIsFieldHidden(params: {
        formFields: FormField[];
        infosAboutWhenFieldsShouldBeHidden: LauncherState.Ready["~internal"]["infosAboutWhenFieldsShouldBeHidden"];
    }) {
        const { formFields, infosAboutWhenFieldsShouldBeHidden } = params;

        function isFieldHidden(params: { path: string[] }) {
            const { path } = params;

            if (same(onyxiaFriendlyNameFormFieldPath, path)) {
                return true;
            }

            const infoAboutWhenFieldsShouldBeHidden =
                infosAboutWhenFieldsShouldBeHidden.find(({ path: path_i }) =>
                    same(path, path_i),
                );

            if (infoAboutWhenFieldsShouldBeHidden === undefined) {
                return false;
            }

            const { isHidden } = infoAboutWhenFieldsShouldBeHidden;

            if (typeof isHidden === "boolean") {
                return isHidden;
            }

            const targetFormField = formFields.find(({ path }) =>
                same(path, isHidden.path),
            );

            assert(
                targetFormField !== undefined,
                [
                    `We can't tell if ${path.join("/")} should be shown or hidden.`,
                    "It is supposed to depend on the value of",
                    isHidden.path.join("/"),
                    "but this field doesn't exists in the chart.",
                ].join(" "),
            );

            return targetFormField.value === isHidden.value;
        }

        return { isFieldHidden };
    }

    const indexedFormFieldsSelector = createSelector(
        configSelector,
        formFieldsSelector,
        infosAboutWhenFieldsShouldBeHiddenSelector,
        packageNameSelector,
        dependenciesSelector,
        (
            config,
            formFields,
            infosAboutWhenFieldsShouldBeHidden,
            packageName,
            dependencies,
        ): IndexedFormFields | undefined => {
            if (
                !formFields ||
                !packageName ||
                !dependencies ||
                !infosAboutWhenFieldsShouldBeHidden
            ) {
                return undefined;
            }

            const indexedFormFields: IndexedFormFields.Scaffolding = {};

            const { isFieldHidden } = createIsFieldHidden({
                formFields,
                infosAboutWhenFieldsShouldBeHidden,
            });

            const nonHiddenFormField = formFields.filter(
                ({ path }) => !isFieldHidden({ path }),
            );

            [...dependencies, "global"].forEach(dependencyOrGlobal => {
                const formFieldsByTabName: IndexedFormFields.Scaffolding[string]["formFieldsByTabName"] =
                    {};

                nonHiddenFormField
                    .filter(({ path }) => path[0] === dependencyOrGlobal)
                    .forEach(formField => {
                        //TODO: Restore: (formFieldsByTabName[formField.path[1]] ??= []).push(formField); when ??= supported
                        (
                            formFieldsByTabName[formField.path[1]] ??
                            (formFieldsByTabName[formField.path[1]] = {
                                "description": (() => {
                                    const o = config?.properties[formField.path[0]];

                                    assert(o?.type === "object");

                                    return o.properties[formField.path[1]].description;
                                })(),
                                "formFields": [],
                            })
                        ).formFields.push(formField);

                        nonHiddenFormField.splice(
                            nonHiddenFormField.indexOf(formField),
                            1,
                        );
                    });

                if (
                    dependencyOrGlobal === "global" &&
                    Object.keys(formFieldsByTabName).length === 0
                ) {
                    return;
                }

                indexedFormFields[dependencyOrGlobal] = {
                    formFieldsByTabName,
                    "meta":
                        dependencyOrGlobal === "global"
                            ? {
                                  "type": "global",
                                  "description": config?.properties["global"].description,
                              }
                            : {
                                  "type": "dependency",
                              },
                };
            });

            {
                const formFieldsByTabName: IndexedFormFields.Scaffolding[string]["formFieldsByTabName"] =
                    indexedFormFields[packageName]?.formFieldsByTabName ?? {};

                nonHiddenFormField.forEach(formField =>
                    (
                        formFieldsByTabName[formField.path[0]] ??
                        (formFieldsByTabName[formField.path[0]] = {
                            "description":
                                config?.properties[formField.path[0]].description,
                            "formFields": [],
                        })
                    ).formFields.push(formField),
                );

                indexedFormFields[packageName] = {
                    formFieldsByTabName,
                    "meta": { "type": "package" },
                };
            }

            //Re assign packageName so it appears before other cards
            return Object.fromEntries(
                Object.entries(
                    scaffoldingIndexedFormFieldsToFinal(indexedFormFields),
                ).sort(([key]) => (key === packageName ? -1 : 0)),
            );
        },
    );

    const isLaunchableSelector = createSelector(
        formFieldsSelector,
        infosAboutWhenFieldsShouldBeHiddenSelector,
        (formFields, infosAboutWhenFieldsShouldBeHidden): boolean | undefined => {
            if (!formFields || !infosAboutWhenFieldsShouldBeHidden) {
                return undefined;
            }

            const { isFieldHidden } = createIsFieldHidden({
                formFields,
                infosAboutWhenFieldsShouldBeHidden,
            });

            return formFields
                .map(formField => (formField.type === "text" ? formField : undefined))
                .filter(exclude(undefined))
                .filter(({ path }) => !isFieldHidden({ path }))
                .map(({ value, pattern }) =>
                    pattern === undefined ? undefined : { value, pattern },
                )
                .filter(exclude(undefined))
                .every(({ value, pattern }) => new RegExp(pattern).test(value));
        },
    );

    const pathOfFormFieldsWhoseValuesAreDifferentFromDefaultSelector = createSelector(
        readyLauncherSelector,
        state => state?.["~internal"].pathOfFormFieldsWhoseValuesAreDifferentFromDefault,
    );

    const catalogIdSelector = createSelector(
        readyLauncherSelector,
        state => state?.catalogId,
    );

    const restorablePackageConfigSelector = createSelector(
        catalogIdSelector,
        packageNameSelector,
        formFieldsSelector,
        pathOfFormFieldsWhoseValuesAreDifferentFromDefaultSelector,
        (
            catalogId,
            packageName,
            formFields,
            pathOfFormFieldsWhoseValuesAreDifferentFromDefault,
        ) =>
            !catalogId ||
            !packageName ||
            !formFields ||
            !pathOfFormFieldsWhoseValuesAreDifferentFromDefault
                ? undefined
                : id<RestorablePackageConfig>({
                      catalogId,
                      packageName,
                      "formFieldsValueDifferentFromDefault":
                          pathOfFormFieldsWhoseValuesAreDifferentFromDefault.map(
                              ({ path }) => ({
                                  path,
                                  "value": formFields.find(formField =>
                                      same(formField.path, path),
                                  )!.value,
                              }),
                          ),
                  }),
    );

    return {
        friendlyNameSelector,
        indexedFormFieldsSelector,
        isLaunchableSelector,
        restorablePackageConfigSelector,
    };
})();

function formFieldValueChangedReducer(params: {
    state: WritableDraft<LauncherState.Ready>;
    formFieldValue: FormFieldValue;
}): void {
    const {
        state,
        formFieldValue: { path, value },
    } = params;

    {
        const formField = state["~internal"].formFields.find(formField =>
            same(formField.path, path),
        )!;

        if (formField.value === value) {
            return;
        }

        formField.value = value;
    }

    {
        const { pathOfFormFieldsWhoseValuesAreDifferentFromDefault } = state["~internal"];

        if (
            state["~internal"].defaultFormFieldsValue.find(formField =>
                same(formField.path, path),
            )!.value !== value
        ) {
            if (
                !pathOfFormFieldsWhoseValuesAreDifferentFromDefault.find(
                    ({ path: path_i }) => same(path_i, path),
                )
            ) {
                pathOfFormFieldsWhoseValuesAreDifferentFromDefault.push({
                    path,
                });
            }
        } else {
            const index = pathOfFormFieldsWhoseValuesAreDifferentFromDefault.findIndex(
                ({ path: path_i }) => same(path_i, path),
            );

            if (index >= 0) {
                pathOfFormFieldsWhoseValuesAreDifferentFromDefault.splice(index, 1);
            }
        }
    }
}
