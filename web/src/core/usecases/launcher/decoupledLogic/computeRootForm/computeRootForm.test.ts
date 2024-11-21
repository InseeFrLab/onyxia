import { describe, it, expect } from "vitest";
import { computeRootForm } from "./computeRootForm";
import { symToStr } from "tsafe/symToStr";
import type { RootForm } from "../formTypes";

describe(symToStr({ computeRootForm }), () => {
    it("simple case", () => {
        const got = computeRootForm({
            chartName: "foo",
            helmValuesSchema: {
                type: "object",
                properties: {
                    services: {
                        type: "object",
                        properties: {
                            a: { type: "string" }
                        }
                    },
                    postgresql: {
                        type: "object",
                        properties: {
                            enabled: { type: "boolean" }
                        }
                    },
                    global: {
                        type: "object",
                        properties: {
                            postgresql: {
                                type: "object",
                                properties: {
                                    username: { type: "string" },
                                    password: { type: "string" }
                                }
                            },
                            c: { type: "number" }
                        }
                    }
                }
            },
            helmDependencies: [
                {
                    chartName: "postgresql",
                    condition: ["postgresql", "enabled"]
                }
            ],
            xOnyxiaContext: {},
            helmValues: {
                services: {
                    a: "foo"
                },
                postgresql: {
                    enabled: true
                },
                global: {
                    postgresql: {
                        username: "admin",
                        password: "xxx"
                    },
                    c: 2
                }
            }
        });

        const expected: RootForm = {
            main: [
                {
                    type: "group",
                    helmValuesPath: ["services"],
                    description: undefined,
                    title: undefined,
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
                            value: "foo"
                        }
                    ],
                    canAdd: false,
                    canRemove: false
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
                            value: "admin"
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
                            value: "xxx"
                        }
                    ]
                }
            }
        };

        expect(got).toStrictEqual(expected);
    });

    it("works with dependency same name as chart", () => {
        const got = computeRootForm({
            chartName: "foo",
            helmValuesSchema: {
                type: "object",
                properties: {
                    services: {
                        type: "object",
                        properties: {
                            a: { type: "string" }
                        }
                    },
                    foo: {
                        type: "object",
                        properties: {
                            b: { type: "string" }
                        }
                    },
                    global: {
                        type: "object",
                        properties: {
                            foo: {
                                type: "object",
                                properties: {
                                    username: { type: "string" },
                                    password: { type: "string" }
                                }
                            },
                            c: { type: "number" }
                        }
                    }
                }
            },
            helmDependencies: [
                {
                    chartName: "foo",
                    condition: undefined
                }
            ],
            xOnyxiaContext: {},
            helmValues: {
                services: {
                    a: "value of services.a"
                },
                foo: {
                    b: "value of foo.b"
                },
                global: {
                    foo: {
                        username: "value of global.foo.username",
                        password: "value of global.foo.password"
                    },
                    c: 2
                }
            }
        });

        const expected: RootForm = {
            main: [
                {
                    type: "group",
                    helmValuesPath: ["services"],
                    description: undefined,
                    title: undefined,
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
                            value: "value of services.a"
                        }
                    ],
                    canAdd: false,
                    canRemove: false
                },
                {
                    type: "field",
                    title: "b",
                    isReadonly: false,
                    fieldType: "text field",
                    helmValuesPath: ["foo", "b"],
                    description: undefined,
                    doRenderAsTextArea: false,
                    isSensitive: false,
                    pattern: undefined,
                    value: "value of foo.b"
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
                },
                {
                    type: "field",
                    title: "username",
                    isReadonly: false,
                    fieldType: "text field",
                    helmValuesPath: ["global", "foo", "username"],
                    description: undefined,
                    doRenderAsTextArea: false,
                    isSensitive: false,
                    pattern: undefined,
                    value: "value of global.foo.username"
                },
                {
                    type: "field",
                    title: "password",
                    isReadonly: false,
                    fieldType: "text field",
                    helmValuesPath: ["global", "foo", "password"],
                    description: undefined,
                    doRenderAsTextArea: false,
                    isSensitive: false,
                    pattern: undefined,
                    value: "value of global.foo.password"
                }
            ],
            dependencies: {}
        };

        expect(got).toStrictEqual(expected);
    });
});
