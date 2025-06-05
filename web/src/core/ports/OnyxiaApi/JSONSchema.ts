import {
    onyxiaReservedPropertyNameInFieldDescription,
    type XOnyxiaParams,
    zXOnyxiaParams
} from "./XOnyxia";
import { type Stringifyable, zStringifyable } from "core/tools/Stringifyable";
import { z } from "zod";
import { assert, type Equals } from "tsafe/assert";
import { id } from "tsafe/id";

export type JSONSchema = {
    type?: "object" | "array" | "string" | "boolean" | "integer" | "number";
    title?: string;
    description?: string;
    default?: Stringifyable;
    hidden?: boolean | { value: Stringifyable; path: string; isPathRelative?: boolean };
    items?: JSONSchema;
    minItems?: number;
    maxItems?: number;
    minimum?: number;
    pattern?: string;
    render?: "textArea" | "password" | "list" | "slider";
    enum?: Stringifyable[];
    listEnum?: Stringifyable[];
    sliderMax?: number;
    sliderMin?: number;
    sliderUnit?: string;
    sliderStep?: number;
    sliderExtremitySemantic?: string;
    sliderRangeId?: string;
    sliderExtremity?: "down" | "up";
    const?: Stringifyable;
    properties?: Record<string, JSONSchema>;
    required?: string[];
    [onyxiaReservedPropertyNameInFieldDescription]?: XOnyxiaParams;
};

export const zJSONSchema = (() => {
    type TargetType = JSONSchema;

    let zTargetType_lazyRef: z.ZodType<TargetType>;

    const zTargetType = z
        .object({
            type: z
                .enum(["object", "array", "string", "boolean", "integer", "number"])
                .optional(),
            title: z.string().optional(),
            description: z.string().optional(),
            default: zStringifyable.optional(),
            hidden: z
                .union([
                    z.boolean(),
                    z.object({
                        value: zStringifyable,
                        path: z.string(),
                        isPathRelative: z.boolean().optional()
                    })
                ])
                .optional(),
            items: z.lazy(() => zTargetType_lazyRef).optional(),
            minItems: z.number().int().optional(),
            maxItems: z.number().nonnegative().int().optional(),
            minimum: z.number().optional(),
            pattern: z.string().optional(),
            render: z.enum(["textArea", "password", "list", "slider"]).optional(),
            enum: z.array(zStringifyable).optional(),
            listEnum: z.array(zStringifyable).optional(),
            sliderMax: z.number().optional(),
            sliderMin: z.number().optional(),
            sliderUnit: z.string().optional(),
            sliderStep: z.number().optional(),
            sliderExtremitySemantic: z.string().optional(),
            sliderRangeId: z.string().optional(),
            sliderExtremity: z.enum(["down", "up"]).optional(),
            const: zStringifyable.optional(),
            properties: z.record(z.lazy(() => zTargetType_lazyRef)).optional(),
            required: z.array(z.string()).optional(),
            [onyxiaReservedPropertyNameInFieldDescription]: zXOnyxiaParams.optional()
        })
        .refine(schema => schema.type !== undefined || schema.const !== undefined, {
            message: "At least one of `type` or `const` must be defined"
        });

    zTargetType_lazyRef = zTargetType;

    type ExtendsEachOther<T, U> = T extends U ? (U extends T ? true : false) : false;

    type Got = z.infer<typeof zTargetType>;

    assert<Equals<keyof Got, keyof TargetType>>();
    // NOTE: Because of default: Stringifyable not optional we can't use Equals...
    assert<ExtendsEachOther<Got, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();
