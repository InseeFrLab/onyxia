import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import { getValueAtPathInObject } from "./getValueAtPathInObject";

{
    const got = getValueAtPathInObject({
        "obj": {
            "a": {
                "b": 42
            }
        },
        "path": ["a", "b"]
    });

    const expected = 42;

    assert(got === expected);

    console.log("PASS - base case");
}

{
    const got = getValueAtPathInObject({
        "obj": {
            "a": {
                "b": { "c": 42 }
            }
        },
        "path": ["a", "b"]
    });

    const expected = { "c": 42 };

    assert(same(got, expected));

    console.log("PASS - resolve to object");
}

{
    const got = getValueAtPathInObject({
        "obj": {
            "a": {
                "b": {}
            }
        },
        "path": ["a", "b", "doesNotExist"]
    });

    const expected = undefined;

    assert(got === expected);

    console.log("PASS - resolve to undefined when path does not exist");
}

{
    const got = getValueAtPathInObject({
        "obj": {
            "a": [{ "b": 41 }, { "b": 42 }]
        },
        "path": ["a", 1, "b"]
    });

    const expected = 42;

    assert(got === expected);

    console.log("PASS - works with arrays");
}
