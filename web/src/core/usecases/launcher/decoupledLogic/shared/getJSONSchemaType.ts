import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import { assert } from "tsafe/assert";

export type JSONSchemaLike = {
    type?: "object" | "array" | "string" | "boolean" | "integer" | "number";
    const?: unknown;
};

assert<keyof JSONSchemaLike extends keyof JSONSchema ? true : false>();
assert<JSONSchema extends JSONSchemaLike ? true : false>();

export function getJSONSchemaType(
    jsonSchema: JSONSchemaLike
): "object" | "array" | "string" | "boolean" | "integer" | "number" {
    return_type: {
        const { type } = jsonSchema;
        if (type === undefined) {
            break return_type;
        }
        return type;
    }

    const { const: constValue } = jsonSchema;

    assert(constValue !== undefined);

    if (typeof constValue === "string") {
        return "string";
    }

    if (typeof constValue === "boolean") {
        return "boolean";
    }

    if (typeof constValue === "number") {
        return "number";
    }

    if (constValue instanceof Array) {
        return "array";
    }

    if (constValue instanceof Object) {
        return "object";
    }

    assert(false);
}
