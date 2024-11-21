import { describe, it, expect } from "vitest";
import { computeRootFormFieldGroup } from "./computeRootFormFieldGroup";
import { symToStr } from "tsafe/symToStr";
import type { FormFieldGroup } from "../formTypes";

describe(symToStr({ computeRootFormFieldGroup }), () => {
    it("simple case", () => {
        const xOnyxiaContext = {
            r: [1, 2, 3]
        };

        const got = computeRootFormFieldGroup({
            helmValuesSchema: {
                type: "object",
                properties: {
                    a: {
                        type: "string"
                    },
                    b: {
                        type: "number",
                        "x-onyxia": {
                            overwriteListEnumWith: "r"
                        }
                    }
                }
            },
            helmValues: {
                a: "foo",
                b: 2
            },
            xOnyxiaContext
        });

        const expected: FormFieldGroup = {
            type: "group",
            helmValuesPath: [],
            description: undefined,
            title: undefined,
            nodes: [
                {
                    type: "field",
                    description: undefined,
                    pattern: undefined,
                    title: "a",
                    isReadonly: false,
                    fieldType: "text field",
                    helmValuesPath: ["a"],
                    doRenderAsTextArea: false,
                    isSensitive: false,
                    value: "foo"
                },
                {
                    type: "field",
                    description: undefined,
                    title: "b",
                    isReadonly: false,
                    fieldType: "select",
                    helmValuesPath: ["b"],
                    options: [1, 2, 3],
                    selectedOptionIndex: 1
                }
            ],
            canAdd: false,
            canRemove: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("const should be readonly", () => {
        const got = computeRootFormFieldGroup({
            helmValuesSchema: {
                type: "object",
                properties: {
                    a: {
                        type: "string",
                        const: "foo"
                    }
                }
            },
            helmValues: {
                a: "foo"
            },
            xOnyxiaContext: {}
        });

        const expected: FormFieldGroup = {
            type: "group",
            helmValuesPath: [],
            description: undefined,
            title: undefined,
            nodes: [
                {
                    type: "field",
                    description: undefined,
                    pattern: undefined,
                    title: "a",
                    isReadonly: true,
                    fieldType: "text field",
                    helmValuesPath: ["a"],
                    doRenderAsTextArea: false,
                    isSensitive: false,
                    value: "foo"
                }
            ],
            canAdd: false,
            canRemove: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("compute hidden field - relative", () => {
        const xOnyxiaContext = {};

        const got = computeRootFormFieldGroup({
            helmValuesSchema: {
                type: "object",
                properties: {
                    persistence: {
                        description: "Configuration for persistence",
                        title: "Persistence",
                        type: "object",
                        properties: {
                            enabled: {
                                type: "boolean",
                                description: "Create a persistent volume"
                            },
                            size: {
                                type: "string",
                                title: "Persistent volume size",
                                description: "Size of the persistent volume",
                                render: "slider",
                                sliderMin: 1,
                                sliderMax: 100,
                                sliderStep: 1,
                                sliderUnit: "Gi",
                                hidden: {
                                    value: false,
                                    path: "enabled",
                                    isPathRelative: true
                                }
                            }
                        }
                    }
                }
            },
            helmValues: {
                persistence: {
                    enabled: false,
                    size: "10Gi"
                }
            },
            xOnyxiaContext
        });

        const expected: FormFieldGroup = {
            type: "group",
            helmValuesPath: [],
            description: undefined,
            title: undefined,
            nodes: [
                {
                    type: "group",
                    helmValuesPath: ["persistence"],
                    description: "Configuration for persistence",
                    title: "Persistence",
                    nodes: [
                        {
                            type: "field",
                            title: "enabled",
                            isReadonly: false,
                            fieldType: "checkbox",
                            helmValuesPath: ["persistence", "enabled"],
                            description: "Create a persistent volume",
                            value: false
                        }
                    ],
                    canAdd: false,
                    canRemove: false
                }
            ],
            canAdd: false,
            canRemove: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("compute hidden field - absolute", () => {
        const xOnyxiaContext = {};

        const got = computeRootFormFieldGroup({
            helmValuesSchema: {
                type: "object",
                properties: {
                    persistence: {
                        description: "Configuration for persistence",
                        title: "Persistence",
                        type: "object",
                        properties: {
                            enabled: {
                                type: "boolean",
                                description: "Create a persistent volume"
                            },
                            size: {
                                type: "string",
                                title: "Persistent volume size",
                                description: "Size of the persistent volume",
                                render: "slider",
                                sliderMin: 1,
                                sliderMax: 100,
                                sliderStep: 1,
                                sliderUnit: "Gi",
                                hidden: {
                                    value: false,
                                    path: "persistence/enabled"
                                }
                            }
                        }
                    }
                }
            },
            helmValues: {
                persistence: {
                    enabled: false,
                    size: "10Gi"
                }
            },
            xOnyxiaContext
        });

        const expected: FormFieldGroup = {
            type: "group",
            helmValuesPath: [],
            description: undefined,
            title: undefined,
            nodes: [
                {
                    type: "group",
                    helmValuesPath: ["persistence"],
                    description: "Configuration for persistence",
                    title: "Persistence",
                    nodes: [
                        {
                            type: "field",
                            title: "enabled",
                            isReadonly: false,
                            fieldType: "checkbox",
                            helmValuesPath: ["persistence", "enabled"],
                            description: "Create a persistent volume",
                            value: false
                        }
                    ],
                    canAdd: false,
                    canRemove: false
                }
            ],
            canAdd: false,
            canRemove: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("with array", () => {
        const xOnyxiaContext = {};

        const got = computeRootFormFieldGroup({
            helmValuesSchema: {
                type: "object",
                properties: {
                    a: {
                        type: "string"
                    },
                    b: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                foo: { type: "string" },
                                bar: { type: "number" }
                            }
                        },
                        minItems: 1
                    }
                }
            },
            helmValues: {
                a: "value of a",
                b: [{ foo: "value of foo", bar: 42 }]
            },
            xOnyxiaContext
        });

        const expected: FormFieldGroup = {
            type: "group",
            helmValuesPath: [],
            description: undefined,
            title: undefined,
            nodes: [
                {
                    type: "field",
                    title: "a",
                    isReadonly: false,
                    fieldType: "text field",
                    helmValuesPath: ["a"],
                    description: undefined,
                    doRenderAsTextArea: false,
                    isSensitive: false,
                    pattern: undefined,
                    value: "value of a"
                },
                {
                    type: "group",
                    helmValuesPath: ["b"],
                    description: undefined,
                    title: undefined,
                    nodes: [
                        {
                            type: "group",
                            helmValuesPath: ["b", 0],
                            description: undefined,
                            title: undefined,
                            nodes: [
                                {
                                    type: "field",
                                    title: "foo",
                                    isReadonly: false,
                                    fieldType: "text field",
                                    helmValuesPath: ["b", 0, "foo"],
                                    description: undefined,
                                    doRenderAsTextArea: false,
                                    isSensitive: false,
                                    pattern: undefined,
                                    value: "value of foo"
                                },
                                {
                                    type: "field",
                                    title: "bar",
                                    isReadonly: false,
                                    fieldType: "number field",
                                    helmValuesPath: ["b", 0, "bar"],
                                    description: undefined,
                                    value: 42,
                                    isInteger: false,
                                    minimum: undefined
                                }
                            ],
                            canAdd: false,
                            canRemove: false
                        }
                    ],
                    canAdd: true,
                    canRemove: false
                }
            ],
            canAdd: false,
            canRemove: false
        };

        expect(got).toStrictEqual(expected);
    });
});
