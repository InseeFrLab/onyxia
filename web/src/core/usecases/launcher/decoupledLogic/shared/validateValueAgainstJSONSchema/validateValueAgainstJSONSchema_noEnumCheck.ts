import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { Stringifyable } from "core/tools/Stringifyable";
import { assert, type Equals } from "tsafe/assert";
import { isAmong } from "tsafe/isAmong";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
// NOTE: Circular dependency but it's ok
import {
    validateValueAgainstJSONSchema,
    type JSONSchemaLike as JSONSchemaLike_validateValueAgainstJSONSchema,
    type XOnyxiaContextLike as XOnyxiaContextLike_validateValueAgainstJSONSchema
} from "./validateValueAgainstJSONSchema";
import {
    getJSONSchemaType,
    type JSONSchemaLike as JSONSchemaLike_getJSONSchemaType
} from "../getJSONSchemaType";

export type JSONSchemaLike = JSONSchemaLike_getJSONSchemaType & {
    items?: JSONSchemaLike_validateValueAgainstJSONSchema;
    minItems?: number;
    maxItems?: number;
    minimum?: number;
    pattern?: string;
    sliderMax?: number;
    sliderMin?: number;
    sliderUnit?: string;
    properties?: Record<string, JSONSchemaLike>;
};

assert<keyof JSONSchemaLike extends keyof JSONSchema ? true : false>();
assert<JSONSchema extends JSONSchemaLike ? true : false>();

export type XOnyxiaContextLike = XOnyxiaContextLike_validateValueAgainstJSONSchema;

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export type ValidationResult =
    | { isValid: true }
    | { isValid: false; reasonableApproximation: Stringifyable | undefined };

export function validateValueAgainstJSONSchema_noEnumCheck(params: {
    helmValuesSchema: JSONSchemaLike;
    xOnyxiaContext: XOnyxiaContextLike;
    value: Stringifyable;
}): ValidationResult {
    const { helmValuesSchema, value, xOnyxiaContext } = params;

    const getIsSliderValueInBounds = (value: number): boolean => {
        if (
            helmValuesSchema.sliderMin !== undefined &&
            value < helmValuesSchema.sliderMin
        ) {
            return false;
        }

        if (
            helmValuesSchema.sliderMax !== undefined &&
            value > helmValuesSchema.sliderMax
        ) {
            return false;
        }

        return true;
    };

    const getIsStringValid = (value: string): boolean => {
        check_match_pattern: {
            if (helmValuesSchema.pattern === undefined) {
                break check_match_pattern;
            }
            if (!new RegExp(helmValuesSchema.pattern).test(value)) {
                return false;
            }
        }

        check_slider: {
            if (helmValuesSchema.sliderUnit === undefined) {
                break check_slider;
            }

            if (!value.endsWith(helmValuesSchema.sliderUnit)) {
                return false;
            }

            const x = parseFloat(
                helmValuesSchema.sliderUnit === ""
                    ? value
                    : value.slice(0, -helmValuesSchema.sliderUnit.length)
            );

            if (isNaN(x)) {
                return false;
            }

            if (!getIsSliderValueInBounds(x)) {
                return false;
            }
        }

        return true;
    };

    const helmValuesSchemaType = getJSONSchemaType(helmValuesSchema);

    const getIsNumberValid = (value: number): boolean => {
        if (helmValuesSchema.minimum !== undefined && value < helmValuesSchema.minimum) {
            return false;
        }

        if (!getIsSliderValueInBounds(value)) {
            return false;
        }

        if (helmValuesSchemaType === "integer" && value !== Math.round(value)) {
            return false;
        }

        return true;
    };

    if (typeof value === "string") {
        switch (helmValuesSchemaType) {
            case "string":
                if (!getIsStringValid(value)) {
                    return { isValid: false, reasonableApproximation: undefined };
                }

                return { isValid: true };
            case "array":
            case "object":
                return { isValid: false, reasonableApproximation: undefined };
            case "boolean": {
                const isValid = false;

                const value_lowerCase = value.toLowerCase();

                if (isAmong(["true", "false"], value_lowerCase)) {
                    return {
                        isValid,
                        reasonableApproximation: value_lowerCase === "true"
                    };
                }
                if (isAmong(["yes", "no"], value_lowerCase)) {
                    return {
                        isValid,
                        reasonableApproximation: value_lowerCase === "yes"
                    };
                }
                if (isAmong(["1", "0"], value_lowerCase)) {
                    return {
                        isValid,
                        reasonableApproximation: value_lowerCase === "1"
                    };
                }
                if (isAmong(["on", "off"], value_lowerCase)) {
                    return {
                        isValid,
                        reasonableApproximation: value_lowerCase === "on"
                    };
                }

                return { isValid, reasonableApproximation: undefined };
            }
            case "integer":
            case "number": {
                const isValid = false;

                const x = parseFloat(value);
                if (isNaN(x)) {
                    return { isValid, reasonableApproximation: undefined };
                }

                if (!getIsNumberValid(x)) {
                    return { isValid, reasonableApproximation: undefined };
                }

                return { isValid, reasonableApproximation: x };
            }
        }
        assert<Equals<typeof helmValuesSchemaType, never>>();
    }

    if (typeof value === "number") {
        switch (helmValuesSchemaType) {
            case "string": {
                const reasonableApproximation = `${value}`;

                if (!getIsStringValid(reasonableApproximation)) {
                    return { isValid: false, reasonableApproximation: undefined };
                }

                return {
                    isValid: false,
                    reasonableApproximation
                };
            }
            case "array":
            case "object":
                return {
                    isValid: false,
                    reasonableApproximation: undefined
                };
            case "boolean":
                return {
                    isValid: false,
                    reasonableApproximation: value !== 0
                };
            case "integer":
            case "number":
                if (!getIsNumberValid(value)) {
                    return { isValid: false, reasonableApproximation: undefined };
                }

                return { isValid: true };
        }
        assert<Equals<typeof helmValuesSchemaType, never>>();
    }

    if (typeof value === "boolean") {
        switch (helmValuesSchemaType) {
            case "string": {
                const reasonableApproximation = value ? "true" : "false";

                if (!getIsStringValid(reasonableApproximation)) {
                    return { isValid: false, reasonableApproximation: undefined };
                }

                return {
                    isValid: false,
                    reasonableApproximation
                };
            }
            case "array":
            case "object":
                return {
                    isValid: false,
                    reasonableApproximation: undefined
                };
            case "boolean":
                return { isValid: true };
            case "integer":
            case "number": {
                const reasonableApproximation = value ? 1 : 0;

                if (!getIsNumberValid(reasonableApproximation)) {
                    return { isValid: false, reasonableApproximation: undefined };
                }

                return {
                    isValid: false,
                    reasonableApproximation
                };
            }
        }
        assert<Equals<typeof helmValuesSchemaType, never>>();
    }

    if (value === null) {
        switch (helmValuesSchemaType) {
            case "string": {
                const reasonableApproximation = "";

                if (!getIsStringValid(reasonableApproximation)) {
                    return { isValid: false, reasonableApproximation: undefined };
                }

                return {
                    isValid: false,
                    reasonableApproximation
                };
            }
            case "array":
            case "object":
                return {
                    isValid: false,
                    reasonableApproximation: undefined
                };
            case "boolean":
                return {
                    isValid: false,
                    reasonableApproximation: false
                };
            case "integer":
            case "number": {
                const reasonableApproximation = 0;

                if (!getIsNumberValid(reasonableApproximation)) {
                    return { isValid: false, reasonableApproximation: undefined };
                }

                return {
                    isValid: false,
                    reasonableApproximation
                };
            }
        }
        assert<Equals<typeof helmValuesSchemaType, never>>();
    }

    if (value instanceof Array) {
        if (helmValuesSchemaType !== "array") {
            return { isValid: false, reasonableApproximation: undefined };
        }

        if (
            !(
                (helmValuesSchema.minItems ?? 0) <= value.length &&
                value.length <= (helmValuesSchema.maxItems ?? Infinity)
            )
        ) {
            return { isValid: false, reasonableApproximation: undefined };
        }

        if (helmValuesSchema.items === undefined) {
            return { isValid: true };
        }

        let isreasonableApproximation = false;
        let valueOrreasonableApproximation: Stringifyable[] = [];

        for (const value_i of value) {
            const validationResult = validateValueAgainstJSONSchema({
                helmValuesSchema: helmValuesSchema.items,
                value: value_i,
                xOnyxiaContext
            });

            if (validationResult.isValid) {
                valueOrreasonableApproximation.push(value_i);
                continue;
            }

            if (validationResult.reasonableApproximation === undefined) {
                return { isValid: false, reasonableApproximation: undefined };
            }

            isreasonableApproximation = true;

            valueOrreasonableApproximation.push(validationResult.reasonableApproximation);
        }

        return isreasonableApproximation
            ? {
                  isValid: false,
                  reasonableApproximation: valueOrreasonableApproximation
              }
            : { isValid: true };
    }

    if (value instanceof Object) {
        if (helmValuesSchemaType !== "object") {
            return { isValid: false, reasonableApproximation: undefined };
        }

        if (helmValuesSchema.properties === undefined) {
            return { isValid: true };
        }

        if (
            Object.keys(value).length !== Object.keys(helmValuesSchema.properties).length
        ) {
            return { isValid: false, reasonableApproximation: undefined };
        }

        let isreasonableApproximation = false;
        const valueOrreasonableApproximation: Record<string, Stringifyable> = {};

        for (const [key, value_i] of Object.entries(value)) {
            const helmValuesSchema_i = helmValuesSchema.properties[key];

            if (helmValuesSchema_i === undefined) {
                return { isValid: false, reasonableApproximation: undefined };
            }

            const validationResult = validateValueAgainstJSONSchema({
                helmValuesSchema: helmValuesSchema_i,
                value: value_i,
                xOnyxiaContext
            });

            if (validationResult.isValid) {
                valueOrreasonableApproximation[key] = value_i;
                continue;
            }

            if (validationResult.reasonableApproximation === undefined) {
                return { isValid: false, reasonableApproximation: undefined };
            }

            isreasonableApproximation = true;

            valueOrreasonableApproximation[key] =
                validationResult.reasonableApproximation;
        }

        return isreasonableApproximation
            ? {
                  isValid: false,
                  reasonableApproximation: valueOrreasonableApproximation
              }
            : { isValid: true };
    }

    assert(false);
}
