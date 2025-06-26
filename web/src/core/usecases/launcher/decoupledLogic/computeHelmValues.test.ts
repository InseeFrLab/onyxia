import { describe, it, expect } from "vitest";
import { computeHelmValues } from "./computeHelmValues";
import YAML from "yaml";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ computeHelmValues }), () => {
    it("Use const", () => {
        const xOnyxiaContext = {
            a: {
                b: {
                    r: "x-onyxia context"
                }
            },
            s3: undefined
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                const: { r: "const" },
                default: { r: "default" },
                "x-onyxia": {
                    overwriteDefaultWith: "a.b"
                }
            },
            helmValuesYaml: YAML.stringify({
                r: "values.yaml"
            }),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: "const" },
            isChartUsingS3: false,
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                const: { r: "const" }
            }
        };

        expect(got).toStrictEqual(expected);
    });

    it("Use x-onyxia", () => {
        const xOnyxiaContext = {
            a: {
                b: {
                    r: "x-onyxia context"
                }
            },
            s3: undefined
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                default: { r: "default" },
                "x-onyxia": {
                    overwriteDefaultWith: "a.b"
                }
            },
            helmValuesYaml: YAML.stringify({
                r: "values.yaml"
            }),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: "x-onyxia context" },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                default: { r: "x-onyxia context" }
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Use default", () => {
        const xOnyxiaContext = {
            a: {
                b: {
                    r: "x-onyxia context"
                }
            },
            s3: undefined
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                default: { r: "default" }
            },
            helmValuesYaml: YAML.stringify({
                r: "values.yaml"
            }),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: "default" },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                default: { r: "default" }
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Use default - real world case", () => {
        const xOnyxiaContext = { s3: undefined };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    gpu: {
                        type: "string",
                        default: "1",
                        render: "slider",
                        sliderMin: 1,
                        sliderMax: 3,
                        sliderUnit: ""
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { gpu: "1" },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    gpu: {
                        type: "string",
                        default: "1",
                        sliderMin: 1,
                        sliderMax: 3,
                        sliderUnit: ""
                    }
                },
                required: ["gpu"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Use values.yaml", () => {
        const xOnyxiaContext = {
            a: {
                b: {
                    r: "x-onyxia context"
                }
            },
            s3: undefined
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object"
            },
            helmValuesYaml: YAML.stringify({
                r: "values.yaml"
            }),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: "values.yaml" },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                default: { r: "values.yaml" }
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Use default if can't resolve in x-onyxia context", () => {
        const xOnyxiaContext = {
            a: {},
            s3: undefined
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                default: { r: "default" },
                "x-onyxia": {
                    overwriteDefaultWith: "a.b"
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: "default" },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                default: { r: "default" }
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Choke if can't find a default", () => {
        const xOnyxiaContext = {
            s3: undefined
        };

        expect(() => {
            computeHelmValues({
                helmValuesSchema: {
                    type: "object",
                    properties: {
                        r: {
                            type: "string"
                        }
                    }
                },
                helmValuesYaml: YAML.stringify({}),
                xOnyxiaContext,
                infoAmountInHelmValues: "user provided"
            });
        }).toThrow();
    });

    it("if const isn't valid, crash", () => {
        const xOnyxiaContext = {
            s3: undefined
        };

        expect(() => {
            computeHelmValues({
                helmValuesSchema: {
                    type: "object",
                    properties: {
                        r: {
                            type: "number",
                            const: "a string"
                        }
                    }
                },
                helmValuesYaml: YAML.stringify({}),
                xOnyxiaContext,
                infoAmountInHelmValues: "user provided"
            });
        }).toThrow();
    });

    it("Convert string from x-onyxia context to number", () => {
        const xOnyxiaContext = {
            a: {
                b: "42"
            },
            s3: undefined
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "number",
                        "x-onyxia": {
                            overwriteDefaultWith: "a.b"
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: 42 },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "number",
                        default: 42
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Fallback to default if string interpreted as number is not an integer", () => {
        const xOnyxiaContext = {
            a: {
                b: "42.5"
            },
            s3: undefined
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "integer",
                        default: 42,
                        "x-onyxia": {
                            overwriteDefaultWith: "a.b"
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: 42 },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "integer",
                        default: 42
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Interpret string as boolean", () => {
        const xOnyxiaContext = {
            a: {
                b: "true"
            },
            s3: undefined
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "boolean",
                        "x-onyxia": {
                            overwriteDefaultWith: "a.b"
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: true },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "boolean",
                        default: true
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Successfully detect access to s3 context", () => {
        const xOnyxiaContext = {
            s3: {
                AWS_ACCESS_KEY_ID: "xxx"
            }
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "string",
                        "x-onyxia": {
                            overwriteDefaultWith: "s3.AWS_ACCESS_KEY_ID"
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: "xxx" },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "string",
                        default: "xxx"
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: true
        };

        expect(got).toStrictEqual(expected);
    });

    it("Resolve to empty array even if no default", () => {
        const xOnyxiaContext = {
            s3: {}
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array"
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: [] },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "array"
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Choke when array, no defaults and minItems is defined", () => {
        const xOnyxiaContext = {
            s3: {}
        };

        expect(() => {
            computeHelmValues({
                helmValuesSchema: {
                    type: "object",
                    properties: {
                        r: {
                            type: "array",
                            minItems: 3
                        }
                    }
                },
                helmValuesYaml: YAML.stringify({}),
                xOnyxiaContext,
                infoAmountInHelmValues: "user provided"
            });
        }).toThrow();
    });

    it("Choke if minItems not respected in default", () => {
        const xOnyxiaContext = {
            s3: {}
        };

        expect(() => {
            computeHelmValues({
                helmValuesSchema: {
                    type: "object",
                    properties: {
                        r: {
                            type: "array",
                            default: ["a", "b"],
                            minItems: 3
                        }
                    }
                },
                helmValuesYaml: YAML.stringify({}),
                xOnyxiaContext,
                infoAmountInHelmValues: "user provided"
            });
        }).toThrow();
    });

    it("Choke if maxItems not respected in default and min items", () => {
        const xOnyxiaContext = {
            s3: {}
        };

        expect(() => {
            computeHelmValues({
                helmValuesSchema: {
                    type: "object",
                    properties: {
                        r: {
                            type: "array",
                            default: ["a", "b", "c", "d"],
                            maxItems: 3,
                            minItems: 1
                        }
                    }
                },
                helmValuesYaml: YAML.stringify({}),
                xOnyxiaContext,
                infoAmountInHelmValues: "user provided"
            });
        }).toThrow();
    });

    it("to throw if the default array does not match the items type", () => {
        const xOnyxiaContext = {
            s3: {}
        };

        expect(() => {
            computeHelmValues({
                helmValuesSchema: {
                    type: "object",
                    properties: {
                        r: {
                            type: "array",
                            minItems: 3,
                            default: ["a", "b", "c"],
                            items: {
                                type: "number"
                            }
                        }
                    }
                },
                helmValuesYaml: YAML.stringify({}),
                xOnyxiaContext,
                infoAmountInHelmValues: "user provided"
            });
        }).toThrow();
    });

    it("to compute successfully if the default array matches the items type", () => {
        const xOnyxiaContext = {
            s3: {}
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        minItems: 3,
                        default: ["a", "b", "c"],
                        items: {
                            type: "string"
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: ["a", "b", "c"] },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        minItems: 3,
                        default: ["a", "b", "c"],
                        items: {
                            type: "string"
                        }
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("to fill array with default items if no default", () => {
        const xOnyxiaContext = {
            s3: {}
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        minItems: 3,
                        items: {
                            type: "string",
                            default: "a"
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: ["a", "a", "a"] },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        minItems: 3,
                        items: {
                            type: "string",
                            default: "a"
                        }
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Default for object array", () => {
        const xOnyxiaContext = {
            s3: {},
            g: {
                xx: "v xx",
                yy: "v yy"
            }
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        "x-onyxia": {
                            overwriteDefaultWith: [{ p: "{{g.xx}}" }, { p: "{{g.yy}}" }]
                        },
                        items: {
                            type: "object"
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: [{ p: "v xx" }, { p: "v yy" }] },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        default: [{ p: "v xx" }, { p: "v yy" }],
                        items: {
                            type: "object"
                        }
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("Fallback to default when nested don't match pattern", () => {
        const xOnyxiaContext = {
            s3: {},
            g: {
                xx: "v xx"
            }
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        "x-onyxia": {
                            overwriteDefaultWith: [{ p: "{{g.xx}}" }, { p: "{{g.yy}}" }]
                        },
                        items: {
                            type: "object",
                            properties: {
                                p: {
                                    type: "string",
                                    pattern: "^.+$"
                                }
                            }
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({
                r: [{ p: "v default xx" }, { p: "v default yy" }]
            }),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: [{ p: "v default xx" }, { p: "v default yy" }] },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        default: [{ p: "v default xx" }, { p: "v default yy" }],
                        items: {
                            type: "object",
                            properties: {
                                p: {
                                    type: "string",
                                    pattern: "^.+$"
                                }
                            },
                            required: ["p"],
                            additionalProperties: false
                        }
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("basic using array as default", () => {
        const xOnyxiaContext = {
            s3: {},
            a: {
                b: [{ p: "foo" }, { p: "bar" }, { p: "baz" }]
            }
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        "x-onyxia": {
                            overwriteDefaultWith: "{{a.b}}"
                        },
                        items: {
                            type: "object",
                            properties: {
                                p: {
                                    type: "string"
                                }
                            }
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: [{ p: "foo" }, { p: "bar" }, { p: "baz" }] },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        default: [{ p: "foo" }, { p: "bar" }, { p: "baz" }],
                        items: {
                            type: "object",
                            properties: {
                                p: {
                                    type: "string"
                                }
                            },
                            required: ["p"],
                            additionalProperties: false
                        }
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("default array work even when extra properties in objects", () => {
        const xOnyxiaContext = {
            s3: {},
            a: {
                b: [
                    { p: "foo", q: "xxx" },
                    { p: "bar", q: "xxx" },
                    { p: "baz", q: "xxx" }
                ]
            }
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        "x-onyxia": {
                            overwriteDefaultWith: "{{a.b}}"
                        },
                        items: {
                            type: "object",
                            properties: {
                                p: {
                                    type: "string"
                                }
                            }
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: { r: [{ p: "foo" }, { p: "bar" }, { p: "baz" }] },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        default: [{ p: "foo" }, { p: "bar" }, { p: "baz" }],
                        items: {
                            type: "object",
                            properties: {
                                p: {
                                    type: "string"
                                }
                            },
                            required: ["p"],
                            additionalProperties: false
                        }
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });

    it("array mapping", () => {
        const xOnyxiaContext = {
            s3: {},
            a: {
                b: [
                    { p: "foo", q_x: "xxx_1" },
                    { p: "bar", q_x: "xxx_2" },
                    { p: "baz", q_x: "xxx_3" }
                ]
            },
            k: "hello"
        };

        const got = computeHelmValues({
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        "x-onyxia": {
                            overwriteDefaultWith: "{{a.b}}"
                        },
                        items: {
                            type: "object",
                            properties: {
                                p: {
                                    type: "string"
                                },
                                q: {
                                    type: "string",
                                    "x-onyxia": {
                                        overwriteDefaultWith: "{{q_x}}"
                                    }
                                },
                                c: {
                                    type: "string",
                                    "x-onyxia": {
                                        overwriteDefaultWith: "{{k}}"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext,
            infoAmountInHelmValues: "user provided"
        });

        const expected = {
            helmValues: {
                r: [
                    { p: "foo", q: "xxx_1", c: "hello" },
                    { p: "bar", q: "xxx_2", c: "hello" },
                    { p: "baz", q: "xxx_3", c: "hello" }
                ]
            },
            helmValuesSchema_forDataTextEditor: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        default: [
                            { p: "foo", q: "xxx_1", c: "hello" },
                            { p: "bar", q: "xxx_2", c: "hello" },
                            { p: "baz", q: "xxx_3", c: "hello" }
                        ],
                        items: {
                            type: "object",
                            properties: {
                                p: {
                                    type: "string"
                                },
                                q: {
                                    type: "string"
                                },
                                c: {
                                    type: "string"
                                }
                            },
                            required: ["p", "q", "c"],
                            additionalProperties: false
                        }
                    }
                },
                required: ["r"],
                additionalProperties: false
            },
            isChartUsingS3: false
        };

        expect(got).toStrictEqual(expected);
    });
});
