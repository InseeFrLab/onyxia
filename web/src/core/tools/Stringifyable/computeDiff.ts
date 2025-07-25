import type { Stringifyable, StringifyableAtomic } from "./Stringifyable";
import { getIsAtomic } from "./getIsAtomic";
import { getValueAtPath } from "./getValueAtPath";

export function computeDiff(params: {
    before: Record<string, Stringifyable> | Stringifyable[];
    current: Record<string, Stringifyable> | Stringifyable[];
}): {
    diffPatch: {
        path: (string | number)[];
        value: StringifyableAtomic | undefined;
    }[];
} {
    const { before, current } = params;

    const diffPatch: {
        path: (string | number)[];
        value: StringifyableAtomic | undefined;
    }[] = [];

    (function crawl(value: Stringifyable, path: (string | number)[]) {
        if (getIsAtomic(value)) {
            if (
                getValueAtPath({
                    stringifyableObjectOrArray: before,
                    path,
                    doDeleteFromSource: false,
                    doFailOnUnresolved: false
                }) !== value
            ) {
                diffPatch.push({
                    path,
                    value: value
                });
            }
            return;
        }

        if (value instanceof Array) {
            value.forEach((e, i) => crawl(e, [...path, i]));
            return;
        }

        Object.entries(value).forEach(([key, value]) => crawl(value, [...path, key]));
    })(current, []);

    (function crawl(value: Stringifyable, path: (string | number)[]) {
        if (
            getValueAtPath({
                stringifyableObjectOrArray: current,
                path,
                doDeleteFromSource: false,
                doFailOnUnresolved: false
            }) === undefined
        ) {
            diffPatch.push({
                path,
                value: undefined
            });
        }

        if (getIsAtomic(value)) {
            return;
        }

        if (value instanceof Array) {
            value.forEach((e, i) => crawl(e, [...path, i]));
            return;
        }

        Object.entries(value).forEach(([key, value]) => crawl(value, [...path, key]));
    })(before, []);

    return { diffPatch };
}
