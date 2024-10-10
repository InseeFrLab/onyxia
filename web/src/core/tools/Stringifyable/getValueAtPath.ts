import type { Stringifyable } from "./Stringifyable";
import { getIsAtomic } from "./getIsAtomic";

function getValueAtPath_rec(
    stringifyable: Stringifyable,
    path: (string | number)[]
): Stringifyable | undefined {
    if (path.length === 0) {
        return stringifyable;
    }

    if (getIsAtomic(stringifyable)) {
        return undefined;
    }

    const [first, ...rest] = path;

    if (stringifyable instanceof Array) {
        if (typeof first !== "number") {
            return undefined;
        }

        return getValueAtPath_rec(stringifyable[first], rest);
    }

    if (typeof first !== "string") {
        return undefined;
    }

    return getValueAtPath_rec(stringifyable[first], rest);
}

export function getValueAtPath(
    stringifyableObjectOrArray: Record<string, Stringifyable> | Stringifyable[],
    path: (string | number)[]
): Stringifyable | undefined {
    return getValueAtPath_rec(stringifyableObjectOrArray, path);
}
