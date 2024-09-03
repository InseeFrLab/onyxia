import { z } from "zod";
import { same } from "evt/tools/inDepth/same";

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
