import "minimal-polyfills/Object.fromEntries";
import type { ThunkAction } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { selectors as userConfigsSelectors } from "./userConfigs";
import { same } from "evt/tools/inDepth/same";
import type { FormFieldValue } from "./sharedDataModel/FormFieldValue";
import { formFieldsValueToObject } from "./sharedDataModel/FormFieldValue";
import {
    onyxiaFriendlyNameFormFieldPath,
    onyxiaIsSharedFormFieldPath,
} from "core/ports/OnyxiaApiClient";
import type { Contract, MustacheParams } from "core/ports/OnyxiaApiClient";
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../setup";
import type { RestorablePackageConfig } from "./restorablePackageConfigs";
import type { WritableDraft } from "immer/dist/types/types-external";
import { thunks as publicIpThunks } from "./publicIp";
import { thunks as userAuthenticationThunk } from "./userAuthentication";
import { selectors as deploymentRegionSelectors } from "./deploymentRegion";
import { exclude } from "tsafe/exclude";
import type {
    JSONSchemaObject,
    JSONSchemaFormFieldDescription,
} from "core/tools/JSONSchemaObject";
import { thunks as projectConfigsThunks } from "./projectConfigs";
import { selectors as projectSelectionSelectors } from "./projectSelection";
import { parseUrl } from "core/tools/parseUrl";
import { typeGuard } from "tsafe/typeGuard";
import { getRandomK8sSubdomain, getServiceId } from "../ports/OnyxiaApiClient";
import { getS3UrlAndRegion } from "../secondaryAdapters/s3Client";
import { interUsecasesThunks as explorersThunks } from "./explorers";

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

type LauncherState = LauncherState.NotInitialized | LauncherState.Ready;

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

export const { name, reducer, actions } = createSlice({
    "name": "launcher",
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
                sensitiveConfigurations: FormFieldValue[];
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
                sensitiveConfigurations,
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
                    sensitiveConfigurations,
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
        "launchCompleted": (state, { payload }: PayloadAction<{ serviceId: string }>) => {
            const { serviceId } = payload;
            assert(state.stateDescription === "ready");
            state.launchState = "launched";
            assert(state.launchState === "launched");
            state.serviceId = serviceId;
        },
    },
});

const privateThunks = {
    "launchOrPreviewContract":
        (params: {
            isForContractPreview: boolean;
        }): ThunkAction<Promise<{ contract: Contract }>> =>
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
                const { serviceId } = getServiceId({
                    "packageName": state.packageName,
                    "randomK8sSubdomain": getRandomK8sSubdomain(),
                });

                dispatch(actions.launchCompleted({ serviceId }));
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
        }): ThunkAction =>
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

            const config = getPackageConfigJSONSchemaObjectWithRenderedMustachParams({
                "mustacheParams": await dispatch(thunks.getMustacheParams()),
            });

            const {
                formFields,
                infosAboutWhenFieldsShouldBeHidden,
                sensitiveConfigurations,
            } = (() => {
                const formFields: LauncherState.Ready["~internal"]["formFields"] = [];
                const infosAboutWhenFieldsShouldBeHidden: LauncherState.Ready["~internal"]["infosAboutWhenFieldsShouldBeHidden"] =
                    [];

                const sensitiveConfigurations: FormFieldValue[] | undefined = (() => {
                    if (
                        getState().restorablePackageConfig.restorablePackageConfigs.find(
                            restorablePackageConfig =>
                                same(restorablePackageConfig, {
                                    packageName,
                                    catalogId,
                                    formFieldsValueDifferentFromDefault,
                                }),
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
                                        T extends JSONSchemaFormFieldDescription,
                                    >(
                                        jsonSchemaFormFieldDescription: T,
                                    ): NonNullable<
                                        NonNullable<T["x-form"]>["value"] | T["default"]
                                    > => {
                                        const valuePotentiallyWronglyTyped = (() => {
                                            const idOrUndefinedIfEmptyStringForBooleanOrNumber =
                                                <
                                                    T extends
                                                        | string
                                                        | boolean
                                                        | number
                                                        | undefined,
                                                >(
                                                    v: T,
                                                ): T | undefined => {
                                                    switch (
                                                        jsonSchemaFormFieldDescription.type
                                                    ) {
                                                        case "boolean":
                                                        case "integer":
                                                        case "number":
                                                            return v === ""
                                                                ? undefined
                                                                : v;
                                                        case "string":
                                                            return v;
                                                    }
                                                };

                                            return (
                                                idOrUndefinedIfEmptyStringForBooleanOrNumber(
                                                    jsonSchemaFormFieldDescription[
                                                        "x-form"
                                                    ]?.value,
                                                ) ??
                                                idOrUndefinedIfEmptyStringForBooleanOrNumber(
                                                    jsonSchemaFormFieldDescription.default,
                                                ) ??
                                                (() => {
                                                    switch (
                                                        jsonSchemaFormFieldDescription.type
                                                    ) {
                                                        case "string":
                                                            return "";
                                                        case "boolean":
                                                            return false;
                                                        case "integer":
                                                        case "number":
                                                            return 0;
                                                    }
                                                })()
                                            );
                                        })();

                                        const value = (() => {
                                            switch (jsonSchemaFormFieldDescription.type) {
                                                case "string": {
                                                    assert(
                                                        typeof valuePotentiallyWronglyTyped ===
                                                            "string",
                                                        `${jsonSchemaFormFieldDescription.title}'s default value should be a string`,
                                                    );

                                                    return valuePotentiallyWronglyTyped;
                                                }
                                                case "boolean": {
                                                    const errorMessage = [
                                                        `${jsonSchemaFormFieldDescription.title}'s default value`,
                                                        `should be a boolean, "true" or "false"`,
                                                    ].join(" ");

                                                    if (
                                                        typeof valuePotentiallyWronglyTyped ===
                                                        "string"
                                                    ) {
                                                        switch (
                                                            valuePotentiallyWronglyTyped
                                                        ) {
                                                            case "true":
                                                                return true;
                                                            case "false":
                                                                return false;
                                                            default:
                                                                throw new Error(
                                                                    errorMessage,
                                                                );
                                                        }
                                                    }

                                                    assert(
                                                        typeof valuePotentiallyWronglyTyped ===
                                                            "boolean",
                                                        errorMessage,
                                                    );

                                                    return valuePotentiallyWronglyTyped;
                                                }
                                                case "integer":
                                                case "number": {
                                                    const errorMessage = [
                                                        `${jsonSchemaFormFieldDescription.title}'s default value`,
                                                        `should be a number, or a string that can be interpreted as a number`,
                                                    ].join(" ");

                                                    if (
                                                        typeof valuePotentiallyWronglyTyped ===
                                                        "string"
                                                    ) {
                                                        const value = parseFloat(
                                                            valuePotentiallyWronglyTyped,
                                                        );

                                                        assert(
                                                            !isNaN(value),
                                                            errorMessage,
                                                        );

                                                        return value;
                                                    }

                                                    assert(
                                                        typeof valuePotentiallyWronglyTyped ===
                                                            "number",
                                                        errorMessage,
                                                    );

                                                    return valuePotentiallyWronglyTyped;
                                                }
                                            }
                                        })();

                                        return value as any;
                                    };

                                    //TODO: The JSON schema should be tested in entry of the system.
                                    if ("render" in jsonSchemaFormFieldDescription) {
                                        assert(
                                            ["slider", "textArea"].find(
                                                render =>
                                                    render ===
                                                    jsonSchemaFormFieldDescription.render,
                                            ) !== undefined,
                                            `${common.path.join("/")} has render: "${
                                                jsonSchemaFormFieldDescription.render
                                            }" and it's not supported`,
                                        );
                                    }

                                    if (
                                        "render" in jsonSchemaFormFieldDescription &&
                                        jsonSchemaFormFieldDescription.render === "slider"
                                    ) {
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
                                        typeGuard<JSONSchemaFormFieldDescription.Integer>(
                                            jsonSchemaFormFieldDescription,
                                            jsonSchemaFormFieldDescription.type ===
                                                "integer" ||
                                                jsonSchemaFormFieldDescription.type ===
                                                    "number",
                                        )
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
                                                ({ path }) => same(path, common.path),
                                            )?.value;

                                        if (value === undefined) {
                                            break security_warning;
                                        }

                                        if (new RegExp(pattern).test(`${value}`)) {
                                            break security_warning;
                                        }

                                        sensitiveConfigurations.push({
                                            "path": common.path,
                                            value,
                                        });
                                    }

                                    return id<FormField.Text>({
                                        ...common,
                                        "pattern": jsonSchemaFormFieldDescription.pattern,
                                        value,
                                        "type": "text",
                                        "defaultValue": value,
                                        "doRenderAsTextArea":
                                            jsonSchemaFormFieldDescription.render ===
                                            "textArea",
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

                return {
                    formFields,
                    infosAboutWhenFieldsShouldBeHidden,
                    sensitiveConfigurations,
                };
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
                    sources,
                    formFields,
                    infosAboutWhenFieldsShouldBeHidden,
                    config,
                    dependencies,
                    formFieldsValueDifferentFromDefault,
                    "sensitiveConfigurations": sensitiveConfigurations ?? [],
                }),
            );
        },
    "reset": (): ThunkAction<void> => dispatch => dispatch(actions.reset()),
    "changeFormFieldValue":
        (params: FormFieldValue): ThunkAction<void> =>
        dispatch =>
            dispatch(actions.formFieldValueChanged(params)),
    "launch": (): ThunkAction => async dispatch => {
        dispatch(
            privateThunks.launchOrPreviewContract({
                "isForContractPreview": false,
            }),
        );
    },
    "getContract": (): ThunkAction<Promise<{ contract: Contract }>> => async dispatch =>
        dispatch(
            privateThunks.launchOrPreviewContract({
                "isForContractPreview": true,
            }),
        ),
    "changeFriendlyName":
        (friendlyName: string): ThunkAction<void> =>
        dispatch =>
            dispatch(
                thunks.changeFormFieldValue({
                    "path": onyxiaFriendlyNameFormFieldPath.split("."),
                    "value": friendlyName,
                }),
            ),
    "changeIsShared":
        (params: { isShared: boolean }): ThunkAction<void> =>
        dispatch =>
            dispatch(
                thunks.changeFormFieldValue({
                    "path": onyxiaIsSharedFormFieldPath.split("."),
                    "value": params.isShared,
                }),
            ),
    /** This thunk can be used outside of the launcher page,
     *  even if the slice isn't initialized */
    "getS3MustacheParamsForProjectBucket":
        (): ThunkAction<
            Promise<
                MustacheParams["s3"] & { expirationTime: number; acquisitionTime: number }
            >
        > =>
        async (...args) => {
            const [, getState, { s3Client }] = args;

            const { s3: s3Params } = deploymentRegionSelectors.selectedDeploymentRegion(
                getState(),
            );

            const project = projectSelectionSelectors.selectedProject(getState());

            const isDefaultProject =
                getState().projectSelection.projects[0].id === project.id;

            if (s3Params === undefined) {
                return {
                    "AWS_ACCESS_KEY_ID": "",
                    "AWS_BUCKET_NAME": "",
                    "AWS_DEFAULT_REGION": "us-east-1" as const,
                    "AWS_S3_ENDPOINT": "",
                    "AWS_SECRET_ACCESS_KEY": "",
                    "AWS_SESSION_TOKEN": "",
                    "port": NaN,
                    "expirationTime": Infinity,
                    "acquisitionTime": Date.now(),
                };
            }

            const {
                accessKeyId,
                secretAccessKey,
                sessionToken,
                expirationTime,
                acquisitionTime,
            } = await s3Client.getToken({
                "restrictToBucketName": isDefaultProject ? undefined : project.bucket,
            });

            s3Client.createBucketIfNotExist(project.bucket);

            const { region, url } = getS3UrlAndRegion(s3Params);

            const { host, port = 443 } = parseUrl(url);

            return {
                "AWS_ACCESS_KEY_ID": accessKeyId,
                "AWS_BUCKET_NAME": project.bucket,
                "AWS_DEFAULT_REGION": region,
                "AWS_S3_ENDPOINT": host,
                port,
                "AWS_SECRET_ACCESS_KEY": secretAccessKey,
                "AWS_SESSION_TOKEN": sessionToken,
                expirationTime,
                acquisitionTime,
            };
        },
    /** This thunk can be used outside of the launcher page,
     *  even if the slice isn't initialized */
    //@deprecated should be moved to privateThunks
    "getMustacheParams":
        (): ThunkAction<Promise<MustacheParams>> =>
        async (...args) => {
            const [dispatch, getState, { createStoreParams, secretsManagerClient }] =
                args;

            const { publicIp } = await dispatch(publicIpThunks.fetch());

            const user = dispatch(userAuthenticationThunk.getUser());

            const userConfigs = userConfigsSelectors.userConfigs(getState());

            const selectedDeploymentRegion =
                deploymentRegionSelectors.selectedDeploymentRegion(getState());

            const servicePassword = await dispatch(
                projectConfigsThunks.getValue({ "key": "servicePassword" }),
            );

            const project = projectSelectionSelectors.selectedProject(getState());

            return {
                "user": {
                    "idep": user.username,
                    "name": `${user.familyName} ${user.firstName}`,
                    "email": user.email,
                    "password": servicePassword,
                    "ip": publicIp,
                },
                "project": {
                    "id": project.id,
                    "password": servicePassword,
                    "basic": btoa(
                        unescape(encodeURIComponent(`${project.id}:${servicePassword}`)),
                    ),
                },
                "git": {
                    "name": userConfigs.gitName,
                    "email": userConfigs.gitEmail,
                    "credentials_cache_duration": userConfigs.gitCredentialCacheDuration,
                    "token": userConfigs.githubPersonalAccessToken,
                },
                "vault": await (async () => {
                    const vaultParams = !("vaultParams" in createStoreParams)
                        ? undefined
                        : createStoreParams.vaultParams;

                    if (vaultParams === undefined) {
                        return {
                            "VAULT_ADDR": "",
                            "VAULT_TOKEN": "",
                            "VAULT_MOUNT": "",
                            "VAULT_TOP_DIR": "",
                        };
                    }

                    return {
                        "VAULT_ADDR": vaultParams.url,
                        "VAULT_TOKEN": (await secretsManagerClient.getToken()).token,
                        "VAULT_MOUNT": vaultParams.engine,
                        "VAULT_TOP_DIR": dispatch(
                            explorersThunks.getProjectHomePath({
                                "explorerType": "secrets",
                            }),
                        ),
                    };
                })(),
                "kaggleApiToken": userConfigs.kaggleApiToken,
                "s3": await dispatch(thunks.getS3MustacheParamsForProjectBucket()),
                "region": {
                    "defaultIpProtection": selectedDeploymentRegion.defaultIpProtection,
                    "defaultNetworkPolicy": selectedDeploymentRegion.defaultNetworkPolicy,
                    "allowedURIPattern":
                        selectedDeploymentRegion.allowedURIPatternForUserDefinedInitScript,
                },
                "k8s": {
                    "domain": selectedDeploymentRegion.kubernetesClusterDomain,
                    "randomSubdomain":
                        (getRandomK8sSubdomain.clear(), getRandomK8sSubdomain()),
                    "initScriptUrl": selectedDeploymentRegion.initScriptUrl,
                },
            };
        },
};

export const selectors = (() => {
    const readyLauncher = (rootState: RootState): LauncherState.Ready | undefined => {
        const state = rootState.launcher;
        switch (state.stateDescription) {
            case "ready":
                return state;
            default:
                return undefined;
        }
    };

    const packageName = createSelector(readyLauncher, state => state?.packageName);

    const formFields = createSelector(
        readyLauncher,
        state => state?.["~internal"].formFields,
    );

    const infosAboutWhenFieldsShouldBeHidden = createSelector(
        readyLauncher,
        state => state?.["~internal"].infosAboutWhenFieldsShouldBeHidden,
    );

    const dependencies = createSelector(
        readyLauncher,
        state => state?.["~internal"].dependencies,
    );

    const friendlyName = createSelector(formFields, formFields => {
        if (formFields === undefined) {
            return undefined;
        }

        const friendlyName = formFields.find(({ path }) =>
            same(path, onyxiaFriendlyNameFormFieldPath.split(".")),
        )!.value;

        assert(typeof friendlyName === "string");

        return friendlyName;
    });

    const isShared = createSelector(formFields, formFields => {
        if (formFields === undefined) {
            return undefined;
        }

        const isShared = formFields.find(({ path }) =>
            same(path, onyxiaIsSharedFormFieldPath.split(".")),
        )!.value;

        assert(typeof isShared === "boolean");

        return isShared;
    });

    const config = createSelector(readyLauncher, state => state?.["~internal"].config);

    function createIsFieldHidden(params: {
        formFields: FormField[];
        infosAboutWhenFieldsShouldBeHidden: LauncherState.Ready["~internal"]["infosAboutWhenFieldsShouldBeHidden"];
    }) {
        const { formFields, infosAboutWhenFieldsShouldBeHidden } = params;

        function isFieldHidden(params: { path: string[] }) {
            const { path } = params;

            for (const onyxiaSpecialFormFieldPath of [
                onyxiaFriendlyNameFormFieldPath,
                onyxiaIsSharedFormFieldPath,
            ]) {
                if (same(onyxiaSpecialFormFieldPath.split("."), path)) {
                    return true;
                }
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

    const isLaunchable = createSelector(
        formFields,
        infosAboutWhenFieldsShouldBeHidden,
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

    const pathOfFormFieldsWhoseValuesAreDifferentFromDefault = createSelector(
        readyLauncher,
        state => state?.["~internal"].pathOfFormFieldsWhoseValuesAreDifferentFromDefault,
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
        friendlyName,
        isShared,
        indexedFormFields,
        isLaunchable,
        restorablePackageConfig,
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
