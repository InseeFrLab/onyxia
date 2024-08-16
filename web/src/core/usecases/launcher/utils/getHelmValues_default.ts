import {
    onyxiaReservedPropertyNameInFieldDescription,
    type XOnyxiaParams
} from "core/ports/OnyxiaApi/XOnyxia";
import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import type {
    StringifyableObject,
    Stringifyable,
    StringifyableArray
} from "core/tools/Stringifyable";
import { assert, type Equals } from "tsafe/assert";
import { id } from "tsafe/id";
import { z } from "zod";
import { same } from "evt/tools/inDepth/same";
import { resolveXOnyxiaValueReference } from "./resolveXOnyxiaValueReference";
import { isAmong } from "tsafe/isAmong";
import YAML from "yaml";

type XOnyxiaParamsLike = {
    overwriteDefaultWith?: string;
};

assert<keyof XOnyxiaParamsLike extends keyof XOnyxiaParams ? true : false>();
assert<XOnyxiaParams extends XOnyxiaParamsLike ? true : false>();

type JSONSchemaLike = {
    type: "object" | "array" | "string" | "boolean" | "integer" | "number";
    default?: Stringifyable;
    const?: Stringifyable;
    properties?: Record<string, JSONSchemaLike>;
    minItems?: number;
    maxItems?: number;
    [onyxiaReservedPropertyNameInFieldDescription]?: XOnyxiaParamsLike;
};

assert<keyof JSONSchemaLike extends keyof JSONSchema ? true : false>();
assert<JSONSchema extends JSONSchemaLike ? true : false>();

type XOnyxiaContextLike = {
    s3: unknown;
};

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export function getHelmValues_default(params: {
    helmValuesSchema: JSONSchemaLike;
    helmValuesYaml: string;
    xOnyxiaContext: XOnyxiaContextLike;
}): {
    helmValues_default: StringifyableObject;
    isChartUsingS3: boolean;
} {
    const { helmValuesSchema, helmValuesYaml, xOnyxiaContext } = params;

    let isChartUsingS3 = false;

    const helmValues_default = getHelmValues_default_rec({
        "helmValuesSchema": (() => {
            zJSONSchemaLike.parse(helmValuesSchema);

            return helmValuesSchema;
        })(),
        "helmValuesYaml_parsed": (() => {
            const helmValuesYaml_parsed = YAML.parse(helmValuesYaml);

            assert(
                helmValuesYaml_parsed instanceof Object &&
                    !(helmValuesYaml_parsed instanceof Array)
            );

            return helmValuesYaml_parsed;
        })(),
        "xOnyxiaContext": (() => {
            const s3PropertyName = "s3";

            assert<
                typeof s3PropertyName extends keyof XOnyxiaContextLike ? true : false
            >();

            return new Proxy(xOnyxiaContext, {
                "get": (...args) => {
                    const [, prop] = args;
                    if (prop === s3PropertyName) {
                        isChartUsingS3 = true;
                    }
                    return Reflect.get(...args);
                }
            });
        })()
    });

    assert(
        helmValues_default instanceof Object && !(helmValues_default instanceof Array)
    );

    return { helmValues_default, isChartUsingS3 };
}

function getHelmValues_default_rec(params: {
    helmValuesSchema: JSONSchemaLike;
    helmValuesYaml_parsed: Stringifyable | undefined;
    xOnyxiaContext: XOnyxiaContextLike;
}): Stringifyable {
    const { helmValuesSchema, helmValuesYaml_parsed, xOnyxiaContext } = params;

    use_const: {
        const constValue = helmValuesSchema.const;

        if (constValue === undefined) {
            break use_const;
        }

        return constValue;
    }

    use_x_onyxia_overwriteDefaultWith: {
        const { overwriteDefaultWith } = helmValuesSchema["x-onyxia"] ?? {};

        if (overwriteDefaultWith === undefined) {
            break use_x_onyxia_overwriteDefaultWith;
        }

        const resolvedValue = resolveXOnyxiaValueReference({
            "expression": overwriteDefaultWith,
            xOnyxiaContext
        });

        if (resolvedValue === undefined) {
            break use_x_onyxia_overwriteDefaultWith;
        }

        resolved_value_is_string: {
            if (typeof resolvedValue !== "string") {
                break resolved_value_is_string;
            }

            switch (helmValuesSchema.type) {
                case "string":
                    return resolvedValue;
                case "array":
                case "object":
                    break use_x_onyxia_overwriteDefaultWith;
                case "boolean": {
                    const resolvedValue_lowerCase = resolvedValue.toLowerCase();

                    if (isAmong(["true", "false"], resolvedValue_lowerCase)) {
                        return resolvedValue_lowerCase === "true";
                    }
                    if (isAmong(["yes", "no"], resolvedValue_lowerCase)) {
                        return resolvedValue_lowerCase === "yes";
                    }
                    if (isAmong(["1", "0"], resolvedValue_lowerCase)) {
                        return resolvedValue_lowerCase === "1";
                    }
                    if (isAmong(["on", "off"], resolvedValue_lowerCase)) {
                        return resolvedValue_lowerCase === "on";
                    }

                    break use_x_onyxia_overwriteDefaultWith;
                }
                case "integer": {
                    const n = parseFloat(resolvedValue);
                    if (isNaN(n)) {
                        break use_x_onyxia_overwriteDefaultWith;
                    }

                    if (n !== Math.round(n)) {
                        break use_x_onyxia_overwriteDefaultWith;
                    }

                    return n;
                }
                case "number": {
                    const n = parseFloat(resolvedValue);
                    if (isNaN(n)) {
                        break use_x_onyxia_overwriteDefaultWith;
                    }
                    return n;
                }
            }

            assert<Equals<typeof helmValuesSchema.type, never>>();
        }

        resolved_value_is_number: {
            if (typeof resolvedValue !== "number") {
                break resolved_value_is_number;
            }

            switch (helmValuesSchema.type) {
                case "string":
                    return `${resolvedValue}`;
                case "array":
                case "object":
                    break use_x_onyxia_overwriteDefaultWith;
                case "boolean":
                    return resolvedValue !== 0;
                case "integer":
                    if (resolvedValue !== Math.round(resolvedValue)) {
                        break use_x_onyxia_overwriteDefaultWith;
                    }
                    return resolvedValue;
                case "number":
                    return resolvedValue;
            }

            assert<Equals<typeof helmValuesSchema.type, never>>();
        }

        resolved_value_is_boolean: {
            if (typeof resolvedValue !== "boolean") {
                break resolved_value_is_boolean;
            }

            switch (helmValuesSchema.type) {
                case "string":
                    return resolvedValue ? "true" : "false";
                case "array":
                case "object":
                    break use_x_onyxia_overwriteDefaultWith;
                case "boolean":
                    return resolvedValue;
                case "integer":
                case "number":
                    return resolvedValue ? 1 : 0;
            }

            assert<Equals<typeof helmValuesSchema.type, never>>();
        }

        resolved_value_is_null: {
            if (resolvedValue !== null) {
                break resolved_value_is_null;
            }

            switch (helmValuesSchema.type) {
                case "string":
                    return "null";
                case "array":
                case "object":
                    break use_x_onyxia_overwriteDefaultWith;
                case "boolean":
                    return false;
                case "integer":
                case "number":
                    return 0;
            }

            assert<Equals<typeof helmValuesSchema.type, never>>();
        }

        resolved_value_is_array: {
            if (!(resolvedValue instanceof Array)) {
                break resolved_value_is_array;
            }

            if (helmValuesSchema.type !== "array") {
                break use_x_onyxia_overwriteDefaultWith;
            }

            if (!getIsCorrectlySizedArray({ helmValuesSchema, "array": resolvedValue })) {
                break use_x_onyxia_overwriteDefaultWith;
            }

            return resolvedValue;
        }

        resolved_value_is_object: {
            if (typeof resolvedValue !== "object") {
                break resolved_value_is_object;
            }

            if (helmValuesSchema.type !== "object") {
                break use_x_onyxia_overwriteDefaultWith;
            }

            return resolvedValue;
        }

        assert(false);
    }

    use_default: {
        const defaultValue = helmValuesSchema.default;

        if (defaultValue === undefined) {
            break use_default;
        }

        const doUseIt = (() => {
            switch (helmValuesSchema.type) {
                case "string":
                    return typeof defaultValue === "string";
                case "array":
                    return (
                        defaultValue instanceof Array &&
                        getIsCorrectlySizedArray({
                            helmValuesSchema,
                            "array": defaultValue
                        })
                    );
                case "object":
                    return typeof defaultValue === "object" && defaultValue !== null;
                case "boolean":
                    return typeof defaultValue === "boolean";
                case "integer":
                    return (
                        typeof defaultValue === "number" &&
                        defaultValue === Math.round(defaultValue)
                    );
                case "number":
                    return typeof defaultValue === "number";
            }

            assert<Equals<typeof helmValuesSchema.type, never>>();
        })();

        if (!doUseIt) {
            break use_default;
        }

        return defaultValue;
    }

    schema_is_object_with_known_properties: {
        if (helmValuesSchema.type !== "object") {
            break schema_is_object_with_known_properties;
        }

        const { properties } = helmValuesSchema;

        if (properties === undefined) {
            break schema_is_object_with_known_properties;
        }

        return Object.fromEntries(
            Object.entries(properties).map(([propertyName, propertySchema]) => [
                propertyName,
                getHelmValues_default_rec({
                    "helmValuesSchema": propertySchema,
                    "helmValuesYaml_parsed":
                        helmValuesYaml_parsed instanceof Object &&
                        !(helmValuesYaml_parsed instanceof Array)
                            ? helmValuesYaml_parsed[propertyName]
                            : undefined,
                    xOnyxiaContext
                })
            ])
        );
    }

    use_values_yaml: {
        if (helmValuesYaml_parsed === undefined) {
            break use_values_yaml;
        }

        const isCorrectType = (() => {
            switch (helmValuesSchema.type) {
                case "string":
                    return typeof helmValuesYaml_parsed === "string";
                case "array":
                    return (
                        helmValuesYaml_parsed instanceof Array &&
                        getIsCorrectlySizedArray({
                            helmValuesSchema,
                            "array": helmValuesYaml_parsed
                        })
                    );
                case "object":
                    return (
                        typeof helmValuesYaml_parsed === "object" &&
                        helmValuesYaml_parsed !== null
                    );
                case "boolean":
                    return typeof helmValuesYaml_parsed === "boolean";
                case "integer":
                    return (
                        typeof helmValuesYaml_parsed === "number" &&
                        helmValuesYaml_parsed === Math.round(helmValuesYaml_parsed)
                    );
                case "number":
                    return typeof helmValuesYaml_parsed === "number";
            }
            assert<Equals<typeof helmValuesSchema.type, never>>();
        })();

        assert(isCorrectType);

        return helmValuesYaml_parsed;
    }

    schema_is_array: {
        if (helmValuesSchema.type !== "array") {
            break schema_is_array;
        }
        assert(
            helmValuesSchema.minItems === undefined || helmValuesSchema.minItems === 1
        );
        return [];
    }

    console.error(params);
    assert(false, "Can't resolve value");
}

function getIsCorrectlySizedArray(params: {
    helmValuesSchema: Pick<JSONSchemaLike, "minItems" | "maxItems">;
    array: StringifyableArray;
}): boolean {
    const { helmValuesSchema, array } = params;

    const { minItems = 0, maxItems = Infinity } = helmValuesSchema;

    return array.length >= minItems && array.length <= maxItems;
}

const zStringifyable: z.ZodType<Stringifyable> = z.any().superRefine((val, ctx) => {
    const isStringifyable = same(JSON.parse(JSON.stringify(val)), val);
    if (!isStringifyable) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Not stringifyable"
        });
    }
});

const zXOnyxiaParamsLike = (() => {
    type TargetType = XOnyxiaParamsLike;

    const zTargetType = z.object({
        "overwriteDefaultWith": z.string().optional()
    });

    assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

const zJSONSchemaLike = (() => {
    type TargetType = JSONSchemaLike;

    let zTargetType_lazyRef: z.ZodType<TargetType>;

    const zTargetType = z.object({
        "type": z.enum(["object", "array", "string", "boolean", "integer", "number"]),
        "default": zStringifyable.optional(),
        "const": zStringifyable.optional(),
        "minItems": z.number().int().optional(),
        "maxItems": z.number().nonnegative().int().optional(),
        "properties": z.record(z.lazy(() => zTargetType_lazyRef)).optional(),
        [onyxiaReservedPropertyNameInFieldDescription]: zXOnyxiaParamsLike.optional()
    });

    zTargetType_lazyRef = zTargetType;

    type ExtendsEachOther<T, U> = T extends U ? (U extends T ? true : false) : false;

    type Got = z.infer<typeof zTargetType>;

    assert<Equals<keyof Got, keyof TargetType>>();
    // NOTE: Because of default: Stringifyable not optional we can't use Equals...
    assert<ExtendsEachOther<Got, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();
