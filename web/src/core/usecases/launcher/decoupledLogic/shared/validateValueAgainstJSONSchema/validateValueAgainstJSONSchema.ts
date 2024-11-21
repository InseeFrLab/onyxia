import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { Stringifyable } from "core/tools/Stringifyable";
import { assert } from "tsafe/assert";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import {
    resolveEnum,
    type JSONSchemaLike as JSONSchemaLike_resolveEnum,
    type XOnyxiaContextLike as XOnyxiaContextLike_resolveEnum
} from "../resolveEnum";
import { same } from "evt/tools/inDepth/same";
import {
    validateValueAgainstJSONSchema_noEnumCheck,
    type JSONSchemaLike as JSONSchemaLike_validateValueAgainstJSONSchema_noEnumCheck,
    type ValidationResult
} from "./validateValueAgainstJSONSchema_noEnumCheck";

export type JSONSchemaLike = JSONSchemaLike_resolveEnum &
    JSONSchemaLike_validateValueAgainstJSONSchema_noEnumCheck & {};

assert<keyof JSONSchemaLike extends keyof JSONSchema ? true : false>();
assert<JSONSchema extends JSONSchemaLike ? true : false>();

export type XOnyxiaContextLike = XOnyxiaContextLike_resolveEnum;

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export function validateValueAgainstJSONSchema(params: {
    helmValuesSchema: JSONSchemaLike;
    xOnyxiaContext: XOnyxiaContextLike;
    value: Stringifyable;
}): ValidationResult {
    const { helmValuesSchema, xOnyxiaContext, value } = params;

    const validationResult = validateValueAgainstJSONSchema_noEnumCheck({
        helmValuesSchema,
        xOnyxiaContext,
        value
    });

    check_is_among_options: {
        const options = resolveEnum({
            helmValuesSchema,
            xOnyxiaContext
        });

        if (options === undefined) {
            break check_is_among_options;
        }

        const valueToTest = validationResult.isValid
            ? value
            : validationResult.reasonableApproximation;

        if (valueToTest === undefined) {
            break check_is_among_options;
        }
        if (options.find(option => same(option, valueToTest)) !== undefined) {
            break check_is_among_options;
        }

        return {
            isValid: false,
            reasonableApproximation: undefined
        };
    }

    return validationResult;
}
