import { resolveXOnyxiaValueReference } from "./resolveXOnyxiaValueReference";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";

// npx tsx src/core/usecases/launcher/utils/resolveXOnyxiaValueReference.test.ts

{
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

    assert(got === expected);

    console.log("PASS 1");
}

{
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

    assert(got === expected);

    console.log("PASS 2");
}

{
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

    assert(same(got, expected));

    console.log("PASS 3");
}

{
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

    assert(same(got, expected));

    console.log("PASS 4");
}

{
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

    assert(got === expected);

    console.log("PASS 5");
}

{
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

    assert(got === expected);

    console.log("PASS 6");
}

{
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

    assert(got === expected);

    console.log("PASS 7");
}

{
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

    assert(got === expected);

    console.log("PASS 8");
}

{
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

    assert(got === expected);

    console.log("PASS 9");
}

{
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

    assert(got === expected);

    console.log("PASS 10");
}

{
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

    assert(got === expected);

    console.log("PASS 11");
}

{
    const got = resolveXOnyxiaValueReference({
        "expression": "a.notExisting.c[1]",
        "xOnyxiaContext": {
            "a": {}
        }
    });

    const expected = undefined;

    assert(got === expected);

    console.log("PASS 12");
}

{
    const got = resolveXOnyxiaValueReference({
        "expression": "{{a.notExisting.c[1]}}-postfix",
        "xOnyxiaContext": {
            "a": {}
        }
    });

    const expected = undefined;

    assert(got === expected);

    console.log("PASS 13");
}

{
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

    assert(got === expected);

    console.log("PASS 14");
}
