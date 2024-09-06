import { it, expect, describe } from "vitest";
import { resolveXOnyxiaValueReference } from "./resolveXOnyxiaValueReference";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ resolveXOnyxiaValueReference }), () => {
    it("PASS 1", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "{{a.b.c}}",
            "xOnyxiaContext": {
                "a": {
                    "b": {
                        "c": 42
                    }
                }
            }
        });

        const expected = 42;

        expect(got).toBe(expected);
    });

    it("PASS 2", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "a.b.c",
            "xOnyxiaContext": {
                "a": {
                    "b": {
                        "c": 42
                    }
                }
            }
        });

        const expected = 42;

        expect(got).toBe(expected);
    });

    it("PASS 3", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "a.b.c",
            "xOnyxiaContext": {
                "a": {
                    "b": {
                        "c": ["x", "y", "z"]
                    }
                }
            }
        });

        const expected = ["x", "y", "z"];

        expect(got).toStrictEqual(expected);
    });

    it("PASS 4", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "a",
            "xOnyxiaContext": {
                "a": {
                    "b": {
                        "c": ["x", "y", "z"]
                    }
                }
            }
        });

        const expected = {
            "b": {
                "c": ["x", "y", "z"]
            }
        };

        expect(got).toStrictEqual(expected);
    });

    it("PASS 5", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "a.b.c",
            "xOnyxiaContext": {
                "a": {
                    "b": {
                        "c": "foo"
                    }
                }
            }
        });

        const expected = "foo";

        expect(got).toBe(expected);
    });

    it("PASS 6", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "{{a.b.c}}-{{a.b.c1}}",
            "xOnyxiaContext": {
                "a": {
                    "b": {
                        "c": "foo",
                        "c1": "bar"
                    }
                }
            }
        });

        const expected = "foo-bar";

        expect(got).toBe(expected);
    });

    it("PASS 7", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "{{a.b.c}}-postfix",
            "xOnyxiaContext": {
                "a": {
                    "b": {
                        "c": 42
                    }
                }
            }
        });

        const expected = "42-postfix";

        expect(got).toBe(expected);
    });

    it("PASS 8", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "a['b'].c",
            "xOnyxiaContext": {
                "a": {
                    "b": {
                        "c": 42
                    }
                }
            }
        });

        const expected = 42;

        expect(got).toBe(expected);
    });

    it("PASS 9", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": 'a["b"].c',
            "xOnyxiaContext": {
                "a": {
                    "b": {
                        "c": 42
                    }
                }
            }
        });

        const expected = 42;

        expect(got).toBe(expected);
    });

    it("PASS 10", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "a.b.c[1]",
            "xOnyxiaContext": {
                "a": {
                    "b": {
                        "c": ["", "yes", ""]
                    }
                }
            }
        });

        const expected = "yes";

        expect(got).toBe(expected);
    });

    it("PASS 11", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "a.b[1].c",
            "xOnyxiaContext": {
                "a": {
                    "b": [
                        "",
                        {
                            "c": "yes"
                        },
                        ""
                    ]
                }
            }
        });

        const expected = "yes";

        expect(got).toBe(expected);
    });

    it("PASS 12", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "a.notExisting.c[1]",
            "xOnyxiaContext": {
                "a": {}
            }
        });

        const expected = undefined;

        expect(got).toBe(expected);
    });

    it("PASS 13", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": "{{a.notExisting.c[1]}}-postfix",
            "xOnyxiaContext": {
                "a": {}
            }
        });

        const expected = undefined;

        expect(got).toBe(expected);
    });

    it("PASS 14", () => {
        const got = resolveXOnyxiaValueReference({
            "expression": 'a["b.c"].d',
            "xOnyxiaContext": {
                "a": {
                    "b.c": {
                        "d": 42
                    }
                }
            }
        });

        const expected = 42;

        expect(got).toBe(expected);
    });
});
