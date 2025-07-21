import type { Stringifyable } from "./Stringifyable";
import { getIsAtomic } from "./getIsAtomic";
import { assert } from "tsafe/assert";

export function getValueAtPath(params: {
    stringifyableObjectOrArray: Record<string, Stringifyable> | Stringifyable[];
    path: (string | number)[];
    doDeleteFromSource: boolean;
    doFailOnUnresolved: false;
}): Stringifyable | undefined;
export function getValueAtPath(params: {
    stringifyableObjectOrArray: Record<string, Stringifyable> | Stringifyable[];
    path: (string | number)[];
    doDeleteFromSource: boolean;
    doFailOnUnresolved: true;
}): Stringifyable;
export function getValueAtPath(params: {
    stringifyableObjectOrArray: Record<string, Stringifyable> | Stringifyable[];
    path: (string | number)[];
    doDeleteFromSource: boolean;
    doFailOnUnresolved: boolean;
}): Stringifyable | undefined {
    const { stringifyableObjectOrArray, path, doDeleteFromSource, doFailOnUnresolved } =
        params;

    if (path.length === 0) {
        return stringifyableObjectOrArray;
    }

    if (path.length === 1) {
        const [lastSegment] = path;

        if (doFailOnUnresolved) {
            assert(lastSegment in stringifyableObjectOrArray);
        }

        let value: Stringifyable;

        if (stringifyableObjectOrArray instanceof Array) {
            assert(typeof lastSegment === "number");

            value = stringifyableObjectOrArray[lastSegment];

            if (doDeleteFromSource) {
                stringifyableObjectOrArray.splice(lastSegment, 1);
            }
        } else {
            value = stringifyableObjectOrArray[lastSegment];

            if (doDeleteFromSource) {
                delete stringifyableObjectOrArray[lastSegment];
            }
        }

        return value;
    }

    const [firstSegment, ...path_next] = path;

    let stringifyableObjectOrArray_next: Stringifyable;

    if (stringifyableObjectOrArray instanceof Array) {
        if (typeof firstSegment !== "number") {
            if (doFailOnUnresolved) {
                assert(false);
            }

            return undefined;
        }

        stringifyableObjectOrArray_next = stringifyableObjectOrArray[firstSegment];
    } else {
        if (typeof firstSegment !== "string") {
            if (doFailOnUnresolved) {
                assert(false);
            }

            return undefined;
        }

        stringifyableObjectOrArray_next = stringifyableObjectOrArray[firstSegment];
    }

    if (getIsAtomic(stringifyableObjectOrArray_next)) {
        if (doFailOnUnresolved) {
            assert(false);
        }

        return undefined;
    }

    return getValueAtPath({
        stringifyableObjectOrArray: stringifyableObjectOrArray_next,
        path: path_next,
        doDeleteFromSource,
        doFailOnUnresolved: doFailOnUnresolved as true
    });
}
