import { assert } from "tsafe/assert";
import { is } from "tsafe/is";
import { z } from "zod";
import { same } from "evt/tools/inDepth/same";

export type Stringifyable =
    | StringifyableAtomic
    | StringifyableObject
    | StringifyableArray;

export type StringifyableAtomic = string | number | boolean | null;

export interface StringifyableObject {
    [key: string]: Stringifyable;
}

export interface StringifyableArray extends Array<Stringifyable> {}

export const zStringifyable: z.ZodType<Stringifyable> = z
    .any()
    .superRefine((val, ctx) => {
        const isStringifyable = same(JSON.parse(JSON.stringify(val)), val);
        if (!isStringifyable) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Not stringifyable"
            });
        }
    });

export function getIsAtomic(
    stringifyable: Stringifyable
): stringifyable is StringifyableAtomic {
    return (
        ["string", "number", "boolean"].includes(typeof stringifyable) ||
        stringifyable === null
    );
}

export const { readValueAtPath } = (() => {
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

    function readValueAtPath(
        stringifyableObjectOrArray: StringifyableObject | StringifyableArray,
        path: (string | number)[]
    ): Stringifyable | undefined {
        return getValueAtPath_rec(stringifyableObjectOrArray, path);
    }

    return { readValueAtPath };
})();

export const { assignValueAtPath } = (() => {
    function assign(
        o: StringifyableObject | StringifyableArray,
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

    function read(o: StringifyableObject | StringifyableArray, k: string | number) {
        if (o instanceof Array) {
            assert(typeof k === "number");
            return o[k];
        } else {
            assert(typeof k === "string");
            return o[k];
        }
    }

    function assignValueAtPath(
        stringifyableObjectOrArray: StringifyableObject | StringifyableArray,
        path: (string | number)[],
        value: Stringifyable
    ): void {
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

        assert(is<StringifyableObject | StringifyableArray>(subObj));

        assignValueAtPath(subObj, rest, value);
    }

    return { assignValueAtPath };
})();

export function jsonParse(str: string): Stringifyable {
    return JSON.parse(str);
}
