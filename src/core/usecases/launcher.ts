import "minimal-polyfills/Object.fromEntries";
import type { State as RootState, Thunks } from "../core";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSelector, createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { selectors as userConfigsSelectors } from "./userConfigs";
import { same } from "evt/tools/inDepth/same";
import type { FormFieldValue } from "./sharedDataModel/FormFieldValue";
import { formFieldsValueToObject } from "./sharedDataModel/FormFieldValue";
import type {
    Contract,
    JSONSchemaFormFieldDescription,
    JSONSchemaObject,
    OnyxiaValues
} from "core/ports/OnyxiaApi";
import {
    onyxiaFriendlyNameFormFieldPath,
    onyxiaIsSharedFormFieldPath
} from "core/ports/OnyxiaApi";
import type { RestorablePackageConfig } from "./restorablePackageConfigs";
import type { WritableDraft } from "immer/dist/types/types-external";
import * as publicIpUsecase from "./publicIp";
import * as userAuthentication from "./userAuthentication";
import * as deploymentRegion from "./deploymentRegion";
import { exclude } from "tsafe/exclude";
import * as projectConfigs from "./projectConfigs";
import { parseUrl } from "core/tools/parseUrl";
import { typeGuard } from "tsafe/typeGuard";
import { getRandomK8sSubdomain, getServiceId } from "../ports/OnyxiaApi";
import { getS3UrlAndRegion } from "../adapters/s3client/getS3UrlAndRegion";
import * as secretExplorer from "./secretExplorer";

import * as yaml from "yaml";
import type { Equals } from "tsafe";

export type FormField =
    | FormField.Boolean
    | FormField.Object
    | FormField.Array
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

    export type Object = Common & {
        type: "object";
        value: FormFieldValue.Value.Yaml;
        defaultValue: FormFieldValue.Value.Yaml;
    };

    export type Array = Common & {
        type: "array";
        value: FormFieldValue.Value.Yaml;
        defaultValue: FormFieldValue.Value.Yaml;
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
        type: "text" | "password";
        pattern: string | undefined;
        value: string;
        defaultValue: string;
        doRenderAsTextArea: boolean;
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

type State = State.NotInitialized | State.Ready;

export declare namespace State {
    export type NotInitialized = {
        stateDescription: "not initialized";
        isInitializing: boolean;
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
            config: JSONSchemaObject;
        };
    } & (
        | {
              launchState: "not launching";
              sensitiveConfigurations: FormFieldValue[];
          }
        | {
              launchState: "launching";
          }
        | {
              launchState: "launched";
              serviceId: string;
          }
    );
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
                    formField: FormField.Slider.Range
                ): IndexedFormFields.AssembledSliderRangeFormField["extremities"][
                    | "up"
                    | "down"] {
                    return {
                        "path": formField.path,
                        "semantic": formField.sliderExtremitySemantic,
                        "value": formField.value
                    };
                }

                function assembleExtremities(
                    formField1: FormField.Slider.Range,
                    formField2: FormField.Slider.Range
                ): IndexedFormFields.AssembledSliderRangeFormField {
                    const formFieldUp =
                        formField1.sliderExtremity === "up" ? formField1 : formField2;

                    assert(formFieldUp.sliderExtremity === "up");

                    const formFieldDown = [formField1, formField2].find(
                        formField => formField !== formFieldUp
                    );

                    assert(
                        formFieldDown !== undefined &&
                            formFieldDown.sliderExtremity === "down"
                    );

                    return {
                        "extremities": {
                            "down": toExtremities(formFieldDown),
                            "up": toExtremities(formFieldUp)
                        },
                        "sliderMax": formFieldUp.sliderMax,
                        ...formFieldDown
                    };
                }

                return { assembleExtremities };
            })();

            function assembleRangeSliderFormField(
                acc: (
                    | IndexedFormFields.AssembledSliderRangeFormField
                    | FormField.Slider.Range
                )[],
                formField: FormField.Slider.Range
            ): void {
                const otherExtremity = acc
                    .map(assembledSliderRangeFormFieldOrFormFieldSliderRange =>
                        "extremities" in
                        assembledSliderRangeFormFieldOrFormFieldSliderRange
                            ? undefined
                            : assembledSliderRangeFormFieldOrFormFieldSliderRange
                    )
                    .filter(exclude(undefined))
                    .find(
                        ({ sliderRangeId }) => sliderRangeId === formField.sliderRangeId
                    );

                if (otherExtremity !== undefined) {
                    acc[acc.indexOf(otherExtremity)] = assembleExtremities(
                        otherExtremity,
                        formField
                    );
                } else {
                    acc.push(formField);
                }
            }

            return { assembleRangeSliderFormField };
        })();

        function assembleFormFields(
            formFields: FormField.Slider.Range[]
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
                        } extremity`
                    );
                }
                return assembledSliderRangeFormField;
            });
        }

        return { assembleFormFields };
    })();

    function scaffoldingIndexedFormFieldsToFinal(
        scaffoldingIndexedFormFields: IndexedFormFields.Scaffolding
    ): IndexedFormFields.Final {
        const indexedFormFields: IndexedFormFields.Final = {};

        Object.entries(scaffoldingIndexedFormFields).forEach(
            ([
                dependencyNamePackageNameOrGlobal,
                { meta, formFieldsByTabName: scaffoldingFormFieldsByTabName }
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
                                assembleFormFields(sliderRangeFormFields)
                        };
                    }
                );

                indexedFormFields[dependencyNamePackageNameOrGlobal] = {
                    meta,
                    formFieldsByTabName
                };
            }
        );

        return indexedFormFields;
    }

    return { scaffoldingIndexedFormFieldsToFinal };
})();

export const name = "launcher";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<State>(
        id<State.NotInitialized>({
            "stateDescription": "not initialized",
            "isInitializing": false
        })
    ),
    "reducers": {
        "initializationStarted": state => {
            assert(state.stateDescription === "not initialized");
            state.isInitializing = true;
        },
        "initialized": (
            state,
            {
                payload
            }: PayloadAction<{
                catalogId: string;
                packageName: string;
                icon: string | undefined;
                sources: string[];
                formFields: State.Ready["~internal"]["formFields"];
                infosAboutWhenFieldsShouldBeHidden: State.Ready["~internal"]["infosAboutWhenFieldsShouldBeHidden"];
                config: State.Ready["~internal"]["config"];
                dependencies: string[];
                formFieldsValueDifferentFromDefault: FormFieldValue[];
                sensitiveConfigurations: FormFieldValue[];
            }>
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
                sensitiveConfigurations
            } = payload;

            Object.assign(
                state,
                id<State.Ready>({
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
                            value
                        })),
                        dependencies,
                        "pathOfFormFieldsWhoseValuesAreDifferentFromDefault": [],
                        config
                    },
                    "launchState": "not launching",
                    sensitiveConfigurations
                })
            );

            assert(state.stateDescription === "ready");

            formFieldsValueDifferentFromDefault.forEach(formFieldValue =>
                formFieldValueChangedReducer({ state, formFieldValue })
            );
        },
        "reset": () =>
            id<State.NotInitialized>({
                "stateDescription": "not initialized",
                "isInitializing": false
            }),
        "formFieldValueChanged": (state, { payload }: PayloadAction<FormFieldValue>) => {
            assert(state.stateDescription === "ready");

            formFieldValueChangedReducer({ state, "formFieldValue": payload });
        },
        "launchStarted": state => {
            assert(state.stateDescription === "ready");
            state.launchState = "launching";
        },
        "launchCompleted": (state, { payload }: PayloadAction<{ serviceId: string }>) => {
            const { serviceId } = payload;
            assert(state.stateDescription === "ready");
            state.launchState = "launched";
            assert(state.launchState === "launched");
            state.serviceId = serviceId;
        }
    }
});

const privateThunks = {
    "launchOrPreviewContract":
        (params: { isForContractPreview: boolean }) =>
        async (...args): Promise<{ contract: Contract }> => {
            const { isForContractPreview } = params;

            const [dispatch, getState, { onyxiaApi }] = args;

            if (!isForContractPreview) {
                dispatch(actions.launchStarted());
            }

            const state = getState().launcher;

            assert(state.stateDescription === "ready");

            const { contract } = await onyxiaApi.launchPackage({
                "catalogId": state.catalogId,
                "packageName": state.packageName,
                "options": formFieldsValueToObject(state["~internal"].formFields),
                "isDryRun": isForContractPreview
            });

            if (!isForContractPreview) {
                const { serviceId } = getServiceId({
                    "packageName": state.packageName,
                    "randomK8sSubdomain": getRandomK8sSubdomain()
                });

                dispatch(actions.launchCompleted({ serviceId }));
            }

            return { contract };
        }
} satisfies Thunks;

export const thunks = {
    "initialize":
        (params: {
            catalogId: string;
            packageName: string;
            formFieldsValueDifferentFromDefault: FormFieldValue[];
        }) =>
        async (...args) => {
            const { catalogId, packageName, formFieldsValueDifferentFromDefault } =
                params;

            const [dispatch, getState, { onyxiaApi, oidc }] = args;

            assert(
                getState().launcher.stateDescription === "not initialized",
                "the reset thunk need to be called before initializing again"
            );

            dispatch(actions.initializationStarted());

            const { dependencies, sources, getValuesSchemaJson } =
                await onyxiaApi.getPackageConfig({
                    catalogId,
                    packageName
                });

            {
                const state = getState().launcher;

                assert(state.stateDescription === "not initialized");

                if (!state.isInitializing) {
                    return;
                }
            }

            assert(oidc.isUserLoggedIn);

            const valuesSchemaJson = getValuesSchemaJson({
                "onyxiaValues": await dispatch(thunks.getOnyxiaValues())
            });

            const {
                formFields,
                infosAboutWhenFieldsShouldBeHidden,
                sensitiveConfigurations
            } = (() => {
                const formFields: State.Ready["~internal"]["formFields"] = [];
                const infosAboutWhenFieldsShouldBeHidden: State.Ready["~internal"]["infosAboutWhenFieldsShouldBeHidden"] =
                    [];

                const sensitiveConfigurations: FormFieldValue[] | undefined = (() => {
                    if (
                        getState().restorablePackageConfig.restorablePackageConfigs.find(
                            restorablePackageConfig =>
                                same(restorablePackageConfig, {
                                    packageName,
                                    catalogId,
                                    formFieldsValueDifferentFromDefault
                                })
                        ) !== undefined
                    ) {
                        return undefined;
                    }

                    return [];
                })();

                (function callee(params: {
                    jsonSchemaObject: JSONSchemaObject;
                    currentPath: string[];
                }): void {
                    const {
                        jsonSchemaObject: { properties },
                        currentPath
                    } = params;

                    Object.entries(properties).forEach(
                        ([key, jsonSchemaObjectOrFormFieldDescription]) => {
                            const newCurrentPath = [...currentPath, key];
                            if (
                                jsonSchemaObjectOrFormFieldDescription.type ===
                                    "object" &&
                                "properties" in jsonSchemaObjectOrFormFieldDescription
                            ) {
                                const jsonSchemaObject =
                                    jsonSchemaObjectOrFormFieldDescription;

                                callee({
                                    "currentPath": newCurrentPath,
                                    jsonSchemaObject
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
                                            jsonSchemaFormFieldDescription["x-onyxia"]
                                                ?.readonly ?? false
                                    };

                                    if (
                                        "render" in jsonSchemaFormFieldDescription &&
                                        ["slider", "textArea", "password", "list"].find(
                                            render =>
                                                render ===
                                                jsonSchemaFormFieldDescription.render
                                        ) === undefined
                                    ) {
                                        console.warn(
                                            `${common.path.join("/")} has render: "${
                                                jsonSchemaFormFieldDescription.render
                                            }" and it's not supported`
                                        );
                                    }

                                    if (
                                        "render" in jsonSchemaFormFieldDescription &&
                                        jsonSchemaFormFieldDescription.render === "slider"
                                    ) {
                                        const value =
                                            jsonSchemaFormFieldDescription.default!;

                                        if (
                                            "sliderExtremity" in
                                            jsonSchemaFormFieldDescription
                                        ) {
                                            const scopCommon = {
                                                ...common,
                                                "type": "slider",
                                                "sliderVariation": "range"
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
                                                            value
                                                        }
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
                                                        value
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
                                            value
                                        });
                                    }

                                    if (
                                        jsonSchemaFormFieldDescription.type === "boolean"
                                    ) {
                                        return id<FormField.Boolean>({
                                            ...common,
                                            "value":
                                                jsonSchemaFormFieldDescription.default,
                                            "type": "boolean"
                                        });
                                    }

                                    if (
                                        jsonSchemaFormFieldDescription.type ===
                                            "object" ||
                                        jsonSchemaFormFieldDescription.type === "array"
                                    ) {
                                        const value = {
                                            "type": "yaml" as const,
                                            "yamlStr": yaml.stringify(
                                                jsonSchemaFormFieldDescription.default
                                            )
                                        };

                                        switch (jsonSchemaFormFieldDescription.type) {
                                            case "array":
                                                return id<FormField.Array>({
                                                    ...common,
                                                    value,
                                                    "defaultValue": value,
                                                    "type": jsonSchemaFormFieldDescription.type
                                                });
                                            case "object":
                                                return id<FormField.Object>({
                                                    ...common,
                                                    value,
                                                    "defaultValue": value,
                                                    "type": jsonSchemaFormFieldDescription.type
                                                });
                                        }

                                        assert<
                                            Equals<
                                                (typeof jsonSchemaFormFieldDescription)["type"],
                                                never
                                            >
                                        >();
                                    }

                                    if (
                                        typeGuard<JSONSchemaFormFieldDescription.Integer>(
                                            jsonSchemaFormFieldDescription,
                                            jsonSchemaFormFieldDescription.type ===
                                                "integer" ||
                                                jsonSchemaFormFieldDescription.type ===
                                                    "number"
                                        )
                                    ) {
                                        return id<FormField.Integer>({
                                            ...common,
                                            "value":
                                                jsonSchemaFormFieldDescription.default,
                                            "minimum":
                                                jsonSchemaFormFieldDescription.minimum,
                                            "type": "integer"
                                        });
                                    }

                                    if (
                                        "render" in jsonSchemaFormFieldDescription &&
                                        jsonSchemaFormFieldDescription.render === "list"
                                    ) {
                                        return id<FormField.Enum>({
                                            ...common,
                                            "value":
                                                jsonSchemaFormFieldDescription.default,
                                            "enum": jsonSchemaFormFieldDescription.listEnum,
                                            "type": "enum"
                                        });
                                    }

                                    if ("enum" in jsonSchemaFormFieldDescription) {
                                        return id<FormField.Enum>({
                                            ...common,
                                            "value":
                                                jsonSchemaFormFieldDescription.default,
                                            "enum": jsonSchemaFormFieldDescription.enum,
                                            "type": "enum"
                                        });
                                    }

                                    security_warning: {
                                        if (sensitiveConfigurations === undefined) {
                                            break security_warning;
                                        }

                                        const { pattern } =
                                            jsonSchemaFormFieldDescription[
                                                "x-security"
                                            ] ?? {};

                                        if (pattern === undefined) {
                                            break security_warning;
                                        }

                                        const value =
                                            formFieldsValueDifferentFromDefault.find(
                                                ({ path }) => same(path, common.path)
                                            )?.value;

                                        if (value === undefined) {
                                            break security_warning;
                                        }

                                        if (new RegExp(pattern).test(`${value}`)) {
                                            break security_warning;
                                        }

                                        sensitiveConfigurations.push({
                                            "path": common.path,
                                            value
                                        });
                                    }

                                    return id<FormField.Text>({
                                        ...common,
                                        "pattern": jsonSchemaFormFieldDescription.pattern,
                                        "value": jsonSchemaFormFieldDescription.default,
                                        "type":
                                            jsonSchemaFormFieldDescription.render ===
                                            "password"
                                                ? "password"
                                                : "text",
                                        "defaultValue":
                                            jsonSchemaFormFieldDescription.default,
                                        "doRenderAsTextArea":
                                            jsonSchemaFormFieldDescription.render ===
                                            "textArea"
                                    });
                                })()
                            );

                            infosAboutWhenFieldsShouldBeHidden.push({
                                "path": newCurrentPath,
                                "isHidden": (() => {
                                    const { hidden } = jsonSchemaFormFieldDescription;

                                    if (hidden === undefined) {
                                        const hidden =
                                            jsonSchemaFormFieldDescription["x-onyxia"]
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
                                        "value": hidden.value
                                    };
                                })()
                            });
                        }
                    );
                })({
                    "currentPath": [],
                    "jsonSchemaObject": valuesSchemaJson
                });

                return {
                    formFields,
                    infosAboutWhenFieldsShouldBeHidden,
                    sensitiveConfigurations
                };
            })();

            dispatch(
                actions.initialized({
                    catalogId,
                    packageName,
                    "icon": await onyxiaApi.getCatalogs().then(
                        apiRequestResult =>
                            //TODO: Sort in the adapter of even better, assumes version sorted
                            //and validate this assertion with zod
                            apiRequestResult
                                .find(({ id }) => id === catalogId)!
                                .charts.find(({ name }) => name === packageName)!
                                .versions[0].icon
                    ),
                    sources,
                    formFields,
                    infosAboutWhenFieldsShouldBeHidden,
                    "config": valuesSchemaJson,
                    dependencies,
                    formFieldsValueDifferentFromDefault,
                    "sensitiveConfigurations": sensitiveConfigurations ?? []
                })
            );
        },
    "reset":
        () =>
        (...args) => {
            const [dispatch] = args;
            dispatch(actions.reset());
        },
    "restoreAllDefault":
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            const state = getState().launcher;

            assert(state.stateDescription === "ready");

            const { defaultFormFieldsValue } = state["~internal"];

            defaultFormFieldsValue.forEach(({ path, value }) => {
                dispatch(
                    actions.formFieldValueChanged({
                        path,
                        value
                    })
                );
            });
        },
    "changeFormFieldValue":
        (params: FormFieldValue) =>
        (...args) => {
            const [dispatch] = args;
            dispatch(actions.formFieldValueChanged(params));
        },
    "launch":
        () =>
        async (...args) => {
            const [dispatch] = args;
            dispatch(
                privateThunks.launchOrPreviewContract({
                    "isForContractPreview": false
                })
            );
        },
    "getContract":
        () =>
        async (...args): Promise<{ contract: Contract }> => {
            const [dispatch] = args;
            return dispatch(
                privateThunks.launchOrPreviewContract({
                    "isForContractPreview": true
                })
            );
        },
    "changeFriendlyName":
        (friendlyName: string) =>
        (...args) => {
            const [dispatch] = args;
            dispatch(
                thunks.changeFormFieldValue({
                    "path": onyxiaFriendlyNameFormFieldPath.split("."),
                    "value": friendlyName
                })
            );
        },
    "changeIsShared":
        (params: { isShared: boolean }) =>
        (...args) => {
            const [dispatch] = args;

            dispatch(
                thunks.changeFormFieldValue({
                    "path": onyxiaIsSharedFormFieldPath.split("."),
                    "value": params.isShared
                })
            );
        },
    /** This thunk can be used outside of the launcher page,
     *  even if the slice isn't initialized */
    //@deprecated should be moved to privateThunks
    "getOnyxiaValues":
        () =>
        async (...args): Promise<OnyxiaValues> => {
            const [dispatch, getState, { secretsManager, s3Client }] = args;

            const { publicIp } = await dispatch(publicIpUsecase.thunks.fetch());

            const user = dispatch(userAuthentication.thunks.getUser());

            const userConfigs = userConfigsSelectors.userConfigs(getState());

            const region = deploymentRegion.selectors.selectedDeploymentRegion(
                getState()
            );

            const servicePassword = await dispatch(
                projectConfigs.thunks.getServicesPassword()
            );

            const project = projectConfigs.selectors.selectedProject(getState());

            const onyxiaValues: OnyxiaValues = {
                "user": {
                    "idep": user.username,
                    "name": `${user.familyName} ${user.firstName}`,
                    "email": user.email,
                    "password": servicePassword,
                    "ip": publicIp
                },
                "project": {
                    "id": project.id,
                    "password": servicePassword,
                    "basic": btoa(
                        unescape(encodeURIComponent(`${project.id}:${servicePassword}`))
                    )
                },
                "git": {
                    "name": userConfigs.gitName,
                    "email": userConfigs.gitEmail,
                    "credentials_cache_duration": userConfigs.gitCredentialCacheDuration,
                    "token": userConfigs.githubPersonalAccessToken ?? undefined
                },
                "vault": await (async () => {
                    const { vault } = region;

                    if (vault === undefined) {
                        return {
                            "VAULT_ADDR": "",
                            "VAULT_TOKEN": "",
                            "VAULT_MOUNT": "",
                            "VAULT_TOP_DIR": ""
                        };
                    }

                    return {
                        "VAULT_ADDR": vault.url,
                        "VAULT_TOKEN": (await secretsManager.getToken()).token,
                        "VAULT_MOUNT": vault.kvEngine,
                        "VAULT_TOP_DIR": dispatch(
                            secretExplorer.protectedThunks.getProjectHomePath()
                        )
                    };
                })(),
                "kaggleApiToken": userConfigs.kaggleApiToken ?? undefined,
                "s3": await (async () => {
                    const project = projectConfigs.selectors.selectedProject(getState());

                    const { accessKeyId, secretAccessKey, sessionToken } =
                        await s3Client.getToken({
                            "restrictToBucketName": project.isDefault
                                ? undefined
                                : project.bucket
                        });

                    s3Client.createBucketIfNotExist(project.bucket);

                    return {
                        "AWS_ACCESS_KEY_ID": accessKeyId,
                        "AWS_BUCKET_NAME": project.bucket,
                        "AWS_SECRET_ACCESS_KEY": secretAccessKey,
                        "AWS_SESSION_TOKEN": sessionToken,
                        ...(() => {
                            const { s3: s3Params } =
                                deploymentRegion.selectors.selectedDeploymentRegion(
                                    getState()
                                );

                            if (s3Params === undefined) {
                                return {
                                    "AWS_DEFAULT_REGION": "",
                                    "AWS_S3_ENDPOINT": "",
                                    "port": 443
                                };
                            }

                            const { region, host, port } = (() => {
                                const { region, url } = getS3UrlAndRegion(s3Params);

                                const { host, port = 443 } = parseUrl(url);

                                return { region, host, port };
                            })();

                            return {
                                "AWS_DEFAULT_REGION": region,
                                "AWS_S3_ENDPOINT": host,
                                port
                            };
                        })()
                    };
                })(),
                "region": {
                    "defaultIpProtection": region.defaultIpProtection,
                    "defaultNetworkPolicy": region.defaultNetworkPolicy,
                    "allowedURIPattern": region.allowedURIPatternForUserDefinedInitScript,
                    "kafka": region.kafka,
                    "from": region.from,
                    "tolerations": region.tolerations,
                    "nodeSelector": region.nodeSelector,
                    "startupProbe": region.startupProbe,
                    "sliders": region.sliders,
                    "resources": region.resources
                },
                "k8s": {
                    "domain": region.kubernetesClusterDomain,
                    "ingressClassName": region.ingressClassName,
                    "ingress": region.ingress,
                    "route": region.route,
                    "istio": region.istio,
                    "randomSubdomain":
                        (getRandomK8sSubdomain.clear(), getRandomK8sSubdomain()),
                    "initScriptUrl": region.initScriptUrl
                },
                "proxyInjection": region.proxyInjection,
                "packageRepositoryInjection": region.packageRepositoryInjection,
                "certificateAuthorityInjection": region.certificateAuthorityInjection
            };

            console.log(onyxiaValues);

            return onyxiaValues;
        }
} satisfies Thunks;

export const selectors = (() => {
    const readyLauncher = (rootState: RootState): State.Ready | undefined => {
        const state = rootState[name];
        switch (state.stateDescription) {
            case "ready":
                return state;
            default:
                return undefined;
        }
    };

    const packageName = createSelector(readyLauncher, state => state?.packageName);

    const sources = createSelector(readyLauncher, state => state?.sources);

    const formFields = createSelector(
        readyLauncher,
        state => state?.["~internal"].formFields
    );

    const infosAboutWhenFieldsShouldBeHidden = createSelector(
        readyLauncher,
        state => state?.["~internal"].infosAboutWhenFieldsShouldBeHidden
    );

    const dependencies = createSelector(
        readyLauncher,
        state => state?.["~internal"].dependencies
    );

    const friendlyName = createSelector(formFields, formFields => {
        if (formFields === undefined) {
            return undefined;
        }

        const friendlyName = formFields.find(({ path }) =>
            same(path, onyxiaFriendlyNameFormFieldPath.split("."))
        )!.value;

        assert(typeof friendlyName === "string");

        return friendlyName;
    });

    const isShared = createSelector(formFields, formFields => {
        if (formFields === undefined) {
            return undefined;
        }

        const isShared = formFields.find(({ path }) =>
            same(path, onyxiaIsSharedFormFieldPath.split("."))
        )!.value;

        assert(typeof isShared === "boolean");

        return isShared;
    });

    const config = createSelector(readyLauncher, state => state?.["~internal"].config);

    function createIsFieldHidden(params: {
        formFields: FormField[];
        infosAboutWhenFieldsShouldBeHidden: State.Ready["~internal"]["infosAboutWhenFieldsShouldBeHidden"];
    }) {
        const { formFields, infosAboutWhenFieldsShouldBeHidden } = params;

        function isFieldHidden(params: { path: string[] }) {
            const { path } = params;

            for (const onyxiaSpecialFormFieldPath of [
                onyxiaFriendlyNameFormFieldPath,
                onyxiaIsSharedFormFieldPath
            ]) {
                if (same(onyxiaSpecialFormFieldPath.split("."), path)) {
                    return true;
                }
            }

            const infoAboutWhenFieldsShouldBeHidden =
                infosAboutWhenFieldsShouldBeHidden.find(({ path: path_i }) =>
                    same(path, path_i)
                );

            if (infoAboutWhenFieldsShouldBeHidden === undefined) {
                return false;
            }

            const { isHidden } = infoAboutWhenFieldsShouldBeHidden;

            if (typeof isHidden === "boolean") {
                return isHidden;
            }

            const targetFormField = formFields.find(({ path }) =>
                same(path, isHidden.path)
            );

            assert(
                targetFormField !== undefined,
                [
                    `We can't tell if ${path.join("/")} should be shown or hidden.`,
                    "It is supposed to depend on the value of",
                    isHidden.path.join("/"),
                    "but this field doesn't exists in the chart."
                ].join(" ")
            );

            return targetFormField.value === isHidden.value;
        }

        return { isFieldHidden };
    }

    const indexedFormFields = createSelector(
        config,
        formFields,
        infosAboutWhenFieldsShouldBeHidden,
        packageName,
        dependencies,
        (
            config,
            formFields,
            infosAboutWhenFieldsShouldBeHidden,
            packageName,
            dependencies
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
                infosAboutWhenFieldsShouldBeHidden
            });

            const nonHiddenFormField = formFields.filter(
                ({ path }) => !isFieldHidden({ path })
            );

            [...dependencies, "global"].forEach(dependencyOrGlobal => {
                const formFieldsByTabName: IndexedFormFields.Scaffolding[string]["formFieldsByTabName"] =
                    {};

                nonHiddenFormField
                    .filter(({ path }) => path[0] === dependencyOrGlobal)
                    .forEach(formField => {
                        (formFieldsByTabName[formField.path[1]] ??= {
                            "description": (() => {
                                const o = config?.properties[formField.path[0]];

                                assert(o?.type === "object" && "properties" in o);

                                return o.properties[formField.path[1]].description;
                            })(),
                            "formFields": []
                        }).formFields.push(formField);

                        nonHiddenFormField.splice(
                            nonHiddenFormField.indexOf(formField),
                            1
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
                                  "description": config?.properties["global"].description
                              }
                            : {
                                  "type": "dependency"
                              }
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
                            "formFields": []
                        })
                    ).formFields.push(formField)
                );

                indexedFormFields[packageName] = {
                    formFieldsByTabName,
                    "meta": { "type": "package" }
                };
            }

            //Re assign packageName so it appears before other cards
            return Object.fromEntries(
                Object.entries(
                    scaffoldingIndexedFormFieldsToFinal(indexedFormFields)
                ).sort(([key]) => (key === packageName ? -1 : 0))
            );
        }
    );

    const formFieldsIsWellFormed = createSelector(
        formFields,
        infosAboutWhenFieldsShouldBeHidden,
        (formFields, infosAboutWhenFieldsShouldBeHidden) => {
            if (!formFields || !infosAboutWhenFieldsShouldBeHidden) {
                return undefined;
            }

            const { isFieldHidden } = createIsFieldHidden({
                formFields,
                infosAboutWhenFieldsShouldBeHidden
            });

            return formFields
                .filter(({ path }) => !isFieldHidden({ path }))
                .map(formField => ({
                    "path": formField.path,
                    ...(():
                        | { isWellFormed: true }
                        | {
                              isWellFormed: false;
                              message: "mismatching pattern";
                              pattern: string;
                          }
                        | {
                              isWellFormed: false;
                              message: "Invalid YAML Object";
                          }
                        | {
                              isWellFormed: false;
                              message: "Invalid YAML Array";
                          } => {
                        switch (formField.type) {
                            case "text": {
                                const { pattern } = formField;

                                if (pattern === undefined) {
                                    return {
                                        "isWellFormed": true
                                    };
                                }

                                const isWellFormed =
                                    pattern === undefined ||
                                    new RegExp(pattern).test(formField.value);

                                return isWellFormed
                                    ? {
                                          "isWellFormed": true
                                      }
                                    : {
                                          "isWellFormed": false,
                                          "message": "mismatching pattern",
                                          pattern
                                      };
                            }
                            case "object": {
                                const { value } = formField;

                                assert(value.type === "yaml");
                                const isWellFormed = (() => {
                                    let obj: any;

                                    try {
                                        obj = yaml.parse(value.yamlStr);
                                    } catch {
                                        return false;
                                    }

                                    return (
                                        obj instanceof Object && !(obj instanceof Array)
                                    );
                                })();

                                return isWellFormed
                                    ? {
                                          "isWellFormed": true
                                      }
                                    : {
                                          "isWellFormed": false,
                                          "message": "Invalid YAML Object"
                                      };
                            }
                            case "array": {
                                const { value } = formField;

                                assert(value.type === "yaml");

                                const isWellFormed = (() => {
                                    let arr: any;

                                    try {
                                        arr = yaml.parse(value.yamlStr);
                                    } catch {
                                        return false;
                                    }

                                    return arr instanceof Array;
                                })();

                                return isWellFormed
                                    ? {
                                          "isWellFormed": true
                                      }
                                    : {
                                          "isWellFormed": false,
                                          "message": "Invalid YAML Array"
                                      };
                            }
                            default:
                                return {
                                    "isWellFormed": true
                                } as const;
                        }
                    })()
                }));
        }
    );

    const isLaunchable = createSelector(
        formFieldsIsWellFormed,
        (formFieldsIsWellFormed): boolean | undefined => {
            if (!formFieldsIsWellFormed) {
                return undefined;
            }

            return formFieldsIsWellFormed.every(({ isWellFormed }) => isWellFormed);
        }
    );

    const pathOfFormFieldsWhoseValuesAreDifferentFromDefault = createSelector(
        readyLauncher,
        state => state?.["~internal"].pathOfFormFieldsWhoseValuesAreDifferentFromDefault
    );

    const catalogId = createSelector(readyLauncher, state => state?.catalogId);

    const restorablePackageConfig = createSelector(
        catalogId,
        packageName,
        formFields,
        pathOfFormFieldsWhoseValuesAreDifferentFromDefault,
        (
            catalogId,
            packageName,
            formFields,
            pathOfFormFieldsWhoseValuesAreDifferentFromDefault
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
                                      same(formField.path, path)
                                  )!.value
                              })
                          )
                  })
    );

    const areAllFieldsDefault = createSelector(
        pathOfFormFieldsWhoseValuesAreDifferentFromDefault,
        pathOfFormFieldsWhoseValuesAreDifferentFromDefault => {
            if (pathOfFormFieldsWhoseValuesAreDifferentFromDefault === undefined) {
                return undefined;
            }

            return pathOfFormFieldsWhoseValuesAreDifferentFromDefault.length === 0;
        }
    );

    return {
        friendlyName,
        isShared,
        indexedFormFields,
        isLaunchable,
        formFieldsIsWellFormed,
        restorablePackageConfig,
        areAllFieldsDefault,
        sources,
        packageName
    };
})();

function formFieldValueChangedReducer(params: {
    state: WritableDraft<State.Ready>;
    formFieldValue: FormFieldValue;
}): void {
    const {
        state,
        formFieldValue: { path, value }
    } = params;

    {
        const formField = state["~internal"].formFields.find(formField =>
            same(formField.path, path)
        )!;

        if (same(formField.value, value)) {
            return;
        }

        formField.value = value;
    }

    {
        const { pathOfFormFieldsWhoseValuesAreDifferentFromDefault } = state["~internal"];

        if (
            state["~internal"].defaultFormFieldsValue.find(formField =>
                same(formField.path, path)
            )!.value !== value
        ) {
            if (
                !pathOfFormFieldsWhoseValuesAreDifferentFromDefault.find(
                    ({ path: path_i }) => same(path_i, path)
                )
            ) {
                pathOfFormFieldsWhoseValuesAreDifferentFromDefault.push({
                    path
                });
            }
        } else {
            const index = pathOfFormFieldsWhoseValuesAreDifferentFromDefault.findIndex(
                ({ path: path_i }) => same(path_i, path)
            );

            if (index >= 0) {
                pathOfFormFieldsWhoseValuesAreDifferentFromDefault.splice(index, 1);
            }
        }
    }
}
