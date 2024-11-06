import { describe, it, expect } from "vitest";
import { mutateHelmValues_addArrayItem } from "./mutateHelmValues_addArrayItem";
import { symToStr } from "tsafe/symToStr";
import * as YAML from "yaml";

describe(symToStr({ mutateHelmValues_addArrayItem }), () => {
    it("simple case", () => {
        const helmValues = { r: [1, 2, 3] };

        mutateHelmValues_addArrayItem({
            helmValues,
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        items: {
                            type: "number",
                            default: 0
                        }
                    }
                }
            },
            helmValuesPath: ["r"],
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext: {}
        });

        expect(helmValues).toStrictEqual({
            r: [1, 2, 3, 0]
        });
    });

    it("takes the default at the correct index", () => {
        const helmValues = { r: [1, 2, 3] };

        mutateHelmValues_addArrayItem({
            helmValues,
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        "x-onyxia": {
                            overwriteDefaultWith: "a.b.c"
                        }
                    }
                }
            },
            helmValuesPath: ["r"],
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext: {
                a: {
                    b: {
                        c: [0, 0, 0, 4]
                    }
                }
            }
        });

        expect(helmValues).toStrictEqual({
            r: [1, 2, 3, 4]
        });
    });

    it("takes the first if not at at index in default", () => {
        const helmValues = { r: [1, 2, 3] };

        mutateHelmValues_addArrayItem({
            helmValues,
            helmValuesSchema: {
                type: "object",
                properties: {
                    r: {
                        type: "array",
                        "x-onyxia": {
                            overwriteDefaultWith: "a.b.c"
                        }
                    }
                }
            },
            helmValuesPath: ["r"],
            helmValuesYaml: YAML.stringify({}),
            xOnyxiaContext: {
                a: {
                    b: {
                        c: [42]
                    }
                }
            }
        });

        expect(helmValues).toStrictEqual({
            r: [1, 2, 3, 42]
        });
    });

    it("throws if no default", () => {
        const helmValues = { r: [1, 2, 3] };

        expect(() => {
            mutateHelmValues_addArrayItem({
                helmValues,
                helmValuesSchema: {
                    type: "object",
                    properties: {
                        r: {
                            type: "array",
                            items: {
                                type: "number"
                            }
                        }
                    }
                },
                helmValuesPath: ["r"],
                helmValuesYaml: YAML.stringify({}),
                xOnyxiaContext: {}
            });
        }).toThrow();
    });
});
