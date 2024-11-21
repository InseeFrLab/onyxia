import { z } from "zod";
import { same } from "evt/tools/inDepth/same";
import { assert, type Equals } from "tsafe/assert";
import { id } from "tsafe/id";

export type Stringifyable =
    | StringifyableAtomic
    | StringifyableObject
    | StringifyableArray;

export type StringifyableAtomic = string | number | boolean | null;

// NOTE: Use Record<string, Stringifyable>
interface StringifyableObject {
    [key: string]: Stringifyable;
}

// NOTE: Use Stringifyable[]
interface StringifyableArray extends Array<Stringifyable> {}

export const zStringifyableAtomic = (() => {
    type TargetType = StringifyableAtomic;

    const zTargetType = z.union([z.string(), z.number(), z.boolean(), z.null()]);

    assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

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
