import { describe, it, expect } from "vitest";
import { findInRootForm, findInRootForm_rangeSlider } from "./findInRootForm";
import type { RootForm } from "../../formTypes";
import { symToStr } from "tsafe/symToStr";

const rootForm: RootForm = {
    main: [
        {
            type: "group",
            helmValuesPath: ["services"],
            title: "services",
            description: undefined,
            nodes: [
                {
                    type: "field",
                    title: "a",
                    isReadonly: false,
                    fieldType: "text field",
                    helmValuesPath: ["services", "a"],
                    description: undefined,
                    doRenderAsTextArea: false,
                    isSensitive: false,
                    pattern: undefined,
                    value: "foo",
                    autocomplete: {
                        options: [],
                        isLoadingOptions: false
                    }
                }
            ],
            canAdd: false,
            canRemove: false,
            isAutoInjected: undefined
        },
        {
            type: "group",
            helmValuesPath: ["resources"],
            title: "resources",
            description: undefined,
            nodes: [
                {
                    type: "field",
                    fieldType: "range slider",
                    highEndRange: {
                        description: undefined,
                        helmValuesPath: ["resources", "limits", "cpu"],
                        isReadonly: false,
                        max: 100,
                        min: 0,
                        rangeEndSemantic: "limits",
                        value: 50
                    },
                    lowEndRange: {
                        description: undefined,
                        helmValuesPath: ["resources", "requests", "cpu"],
                        isReadonly: false,
                        max: 100,
                        min: 0,
                        rangeEndSemantic: "requests",
                        value: 50
                    },
                    step: undefined,
                    unit: "Mi",
                    title: "cpu"
                }
            ],
            canAdd: false,
            canRemove: false,
            isAutoInjected: undefined
        }
    ],
    disabledDependencies: [],
    global: [
        {
            type: "field",
            title: "c",
            isReadonly: false,
            fieldType: "number field",
            helmValuesPath: ["global", "c"],
            description: undefined,
            value: 2,
            isInteger: false,
            minimum: undefined
        }
    ],
    dependencies: {
        postgresql: {
            main: [
                {
                    type: "field",
                    title: "enabled",
                    isReadonly: false,
                    fieldType: "checkbox",
                    helmValuesPath: ["postgresql", "enabled"],
                    description: undefined,
                    value: true
                }
            ],
            global: [
                {
                    type: "field",
                    title: "username",
                    isReadonly: false,
                    fieldType: "text field",
                    helmValuesPath: ["global", "postgresql", "username"],
                    description: undefined,
                    doRenderAsTextArea: false,
                    isSensitive: false,
                    pattern: undefined,
                    value: "admin",
                    autocomplete: {
                        options: [],
                        isLoadingOptions: false
                    }
                },
                {
                    type: "field",
                    title: "password",
                    isReadonly: false,
                    fieldType: "text field",
                    helmValuesPath: ["global", "postgresql", "password"],
                    description: undefined,
                    doRenderAsTextArea: false,
                    isSensitive: false,
                    pattern: undefined,
                    value: "xxx",
                    autocomplete: {
                        options: [],
                        isLoadingOptions: false
                    }
                }
            ]
        }
    }
};

describe(symToStr({ findInRootForm }), () => {
    it("simple case", () => {
        const formField = findInRootForm({
            helmValuesPath: ["services", "a"],
            rootForm
        });

        expect(formField).toStrictEqual({
            type: "field",
            title: "a",
            isReadonly: false,
            fieldType: "text field",
            helmValuesPath: ["services", "a"],
            description: undefined,
            doRenderAsTextArea: false,
            isSensitive: false,
            pattern: undefined,
            value: "foo",
            autocomplete: {
                options: [],
                isLoadingOptions: false
            }
        });
    });

    it("find in dependencies", () => {
        const formField = findInRootForm({
            helmValuesPath: ["postgresql", "enabled"],
            rootForm
        });

        expect(formField).toStrictEqual({
            type: "field",
            title: "enabled",
            isReadonly: false,
            fieldType: "checkbox",
            helmValuesPath: ["postgresql", "enabled"],
            description: undefined,
            value: true
        });
    });
});

describe(symToStr({ findInRootForm_rangeSlider }), () => {
    it("simple case", () => {
        const formField = findInRootForm_rangeSlider({
            rootForm,
            helmValuesPath_highEndRange: ["resources", "limits", "cpu"],
            helmValuesPath_lowEndRange: ["resources", "requests", "cpu"]
        });

        expect(formField).toStrictEqual({
            type: "field",
            fieldType: "range slider",
            highEndRange: {
                description: undefined,
                helmValuesPath: ["resources", "limits", "cpu"],
                isReadonly: false,
                max: 100,
                min: 0,
                rangeEndSemantic: "limits",
                value: 50
            },
            lowEndRange: {
                description: undefined,
                helmValuesPath: ["resources", "requests", "cpu"],
                isReadonly: false,
                max: 100,
                min: 0,
                rangeEndSemantic: "requests",
                value: 50
            },
            step: undefined,
            unit: "Mi",
            title: "cpu"
        });
    });
});
