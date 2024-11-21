import { assert, is } from "tsafe/assert";
import type { Stringifyable } from "./Stringifyable";

function assign(
    o: Record<string, Stringifyable> | Stringifyable[],
    k: string | number,
    v: Stringifyable
) {
    if (o instanceof Array) {
        assert(typeof k === "number");
        o[k] = v;
    } else {
        assert(typeof k === "string");
        o[k] = v;
    }
}

function read(o: Record<string, Stringifyable> | Stringifyable[], k: string | number) {
    if (o instanceof Array) {
        assert(typeof k === "number");
        return o[k];
    } else {
        assert(typeof k === "string");
        return o[k];
    }
}

export function assignValueAtPath(params: {
    stringifyableObjectOrArray: Record<string, Stringifyable> | Stringifyable[];
    path: (string | number)[];
    value: Stringifyable;
}): void {
    const { stringifyableObjectOrArray, path, value } = params;

    const [first, ...rest] = path;

    assert(first !== undefined);

    if (rest.length === 0) {
        assign(stringifyableObjectOrArray, first, value);
        return;
    }

    {
        const [second] = rest;

        if (typeof second === "number") {
            if (!(read(stringifyableObjectOrArray, first) instanceof Array)) {
                assign(stringifyableObjectOrArray, first, []);
            }
        } else {
            if (!(read(stringifyableObjectOrArray, first) instanceof Object)) {
                assign(stringifyableObjectOrArray, first, {});
            }
        }
    }

    const subObj = read(stringifyableObjectOrArray, first);

    assert(is<Record<string, Stringifyable> | Stringifyable[]>(subObj));

    assignValueAtPath({
        stringifyableObjectOrArray: subObj,
        path: rest,
        value
    });
}
