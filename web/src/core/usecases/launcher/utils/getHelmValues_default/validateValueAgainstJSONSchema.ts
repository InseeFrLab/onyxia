import {
    onyxiaReservedPropertyNameInFieldDescription,
    type XOnyxiaParams
} from "core/ports/OnyxiaApi/XOnyxia";
import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { Stringifyable } from "core/tools/Stringifyable";
import { assert } from "tsafe/assert";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import {
    resolveEnum,
    type JSONSchemaLike as JSONSchemaLike_resolveEnum,
    type XOnyxiaContextLike as XOnyxiaContextLike_resolveEnum
} from "../shared/resolveEnum";
import { same } from "evt/tools/inDepth/same";
import {
    validateValueAgainstJSONSchema_noEnumCheck,
    type JSONSchemaLike as JSONSchemaLike_validateValueAgainstJSONSchema_noEnumCheck,
    type ValidationResult
} from "../shared/validateValueAgainstJSONSchema_noEnumCheck";

type XOnyxiaParamsLike = {
    overwriteListEnumWith?: string;
};

assert<keyof XOnyxiaParamsLike extends keyof XOnyxiaParams ? true : false>();
assert<XOnyxiaParams extends XOnyxiaParamsLike ? true : false>();

export type JSONSchemaLike = JSONSchemaLike_resolveEnum &
    JSONSchemaLike_validateValueAgainstJSONSchema_noEnumCheck & {
        type: "object" | "array" | "string" | "boolean" | "integer" | "number";
        items?: JSONSchemaLike;
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
        properties?: Record<string, JSONSchemaLike>;
        [onyxiaReservedPropertyNameInFieldDescription]?: XOnyxiaParamsLike;
    };

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

    return validateValueAgainstJSONSchema_rec({
        helmValuesSchema,
        xOnyxiaContext,
        value,
        "doSkipEnumCheck": false
    });
}

function validateValueAgainstJSONSchema_rec(params: {
    helmValuesSchema: JSONSchemaLike;
    xOnyxiaContext: XOnyxiaContextLike;
    value: Stringifyable;
    doSkipEnumCheck: boolean;
}): ValidationResult {
    const { helmValuesSchema, xOnyxiaContext, value, doSkipEnumCheck } = params;

    const validationResult = validateValueAgainstJSONSchema_noEnumCheck({
        helmValuesSchema,
        value
    });

    check_is_among_options: {
        if (doSkipEnumCheck) {
            break check_is_among_options;
        }

        const options = resolveEnum({
            helmValuesSchema,
            xOnyxiaContext
        });

        if (options === undefined) {
            break check_is_among_options;
        }

        const valueToTest = validationResult.isValid
            ? value
            : validationResult.bestApproximation;

        if (valueToTest === undefined) {
            break check_is_among_options;
        }
        if (options.find(option => same(option, valueToTest)) !== undefined) {
            break check_is_among_options;
        }

        return {
            "isValid": false,
            "bestApproximation": undefined
        };
    }

    return validationResult;
}
