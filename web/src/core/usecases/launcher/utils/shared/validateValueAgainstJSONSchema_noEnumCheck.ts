import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { Stringifyable } from "core/tools/Stringifyable";
import { assert, type Equals } from "tsafe/assert";
import { isAmong } from "tsafe/isAmong";

export type JSONSchemaLike = {
    type: "object" | "array" | "string" | "boolean" | "integer" | "number";
    items?: JSONSchemaLike;
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

export type ValidationResult =
    | { isValid: true }
    | { isValid: false; bestApproximation: Stringifyable | undefined };

export function validateValueAgainstJSONSchema_noEnumCheck(params: {
    helmValuesSchema: JSONSchemaLike;
    value: Stringifyable;
}): ValidationResult {
    const { helmValuesSchema, value } = params;

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

            const x = parseFloat(value.slice(0, -helmValuesSchema.sliderUnit.length));

            if (isNaN(x)) {
                return false;
            }

            if (!getIsSliderValueInBounds(x)) {
                return false;
            }
        }

        return true;
    };

    const getIsNumberValid = (value: number): boolean => {
        if (helmValuesSchema.minimum !== undefined && value < helmValuesSchema.minimum) {
            return false;
        }

        if (!getIsSliderValueInBounds(value)) {
            return false;
        }

        if (helmValuesSchema.type === "integer" && value !== Math.round(value)) {
            return false;
        }

        return true;
    };

    if (typeof value === "string") {
        switch (helmValuesSchema.type) {
            case "string":
                if (!getIsStringValid(value)) {
                    return { "isValid": false, "bestApproximation": undefined };
                }

                return { "isValid": true };
            case "array":
            case "object":
                return { "isValid": false, "bestApproximation": undefined };
            case "boolean": {
                const isValid = false;

                const value_lowerCase = value.toLowerCase();

                if (isAmong(["true", "false"], value_lowerCase)) {
                    return {
                        isValid,
                        "bestApproximation": value_lowerCase === "true"
                    };
                }
                if (isAmong(["yes", "no"], value_lowerCase)) {
                    return {
                        isValid,
                        "bestApproximation": value_lowerCase === "yes"
                    };
                }
                if (isAmong(["1", "0"], value_lowerCase)) {
                    return {
                        isValid,
                        "bestApproximation": value_lowerCase === "1"
                    };
                }
                if (isAmong(["on", "off"], value_lowerCase)) {
                    return {
                        isValid,
                        "bestApproximation": value_lowerCase === "on"
                    };
                }

                return { isValid, "bestApproximation": undefined };
            }
            case "integer":
            case "number": {
                const isValid = false;

                const x = parseFloat(value);
                if (isNaN(x)) {
                    return { isValid, "bestApproximation": undefined };
                }

                if (!getIsNumberValid(x)) {
                    return { isValid, "bestApproximation": undefined };
                }

                return { isValid, "bestApproximation": x };
            }
        }
        assert<Equals<typeof helmValuesSchema.type, never>>();
    }

    if (typeof value === "number") {
        switch (helmValuesSchema.type) {
            case "string": {
                const bestApproximation = `${value}`;

                if (!getIsStringValid(bestApproximation)) {
                    return { "isValid": false, "bestApproximation": undefined };
                }

                return {
                    "isValid": false,
                    bestApproximation
                };
            }
            case "array":
            case "object":
                return {
                    "isValid": false,
                    "bestApproximation": undefined
                };
            case "boolean":
                return {
                    "isValid": false,
                    "bestApproximation": value !== 0
                };
            case "integer":
                if (value !== Math.round(value)) {
                    return { "isValid": false, "bestApproximation": undefined };
                }
                return { "isValid": true };
            case "number":
                return { "isValid": true };
        }
        assert<Equals<typeof helmValuesSchema.type, never>>();
    }

    if (typeof value === "boolean") {
        switch (helmValuesSchema.type) {
            case "string": {
                const bestApproximation = value ? "true" : "false";

                if (!getIsStringValid(bestApproximation)) {
                    return { "isValid": false, "bestApproximation": undefined };
                }

                return {
                    "isValid": false,
                    bestApproximation
                };
            }
            case "array":
            case "object":
                return {
                    "isValid": false,
                    "bestApproximation": undefined
                };
            case "boolean":
                return { "isValid": true };
            case "integer":
            case "number": {
                const bestApproximation = value ? 1 : 0;

                if (!getIsNumberValid(bestApproximation)) {
                    return { "isValid": false, "bestApproximation": undefined };
                }

                return {
                    "isValid": false,
                    bestApproximation
                };
            }
        }
        assert<Equals<typeof helmValuesSchema.type, never>>();
    }

    if (value === null) {
        switch (helmValuesSchema.type) {
            case "string": {
                const bestApproximation = "";

                if (!getIsStringValid(bestApproximation)) {
                    return { "isValid": false, "bestApproximation": undefined };
                }

                return {
                    "isValid": false,
                    bestApproximation
                };
            }
            case "array":
            case "object":
                return {
                    "isValid": false,
                    "bestApproximation": undefined
                };
            case "boolean":
                return {
                    "isValid": false,
                    "bestApproximation": false
                };
            case "integer":
            case "number": {
                const bestApproximation = 0;

                if (!getIsNumberValid(bestApproximation)) {
                    return { "isValid": false, "bestApproximation": undefined };
                }

                return {
                    "isValid": false,
                    bestApproximation
                };
            }
        }
        assert<Equals<typeof helmValuesSchema.type, never>>();
    }

    if (value instanceof Array) {
        if (helmValuesSchema.type !== "array") {
            return { "isValid": false, "bestApproximation": undefined };
        }

        if (
            !(
                (helmValuesSchema.minItems ?? 0) <= value.length &&
                value.length <= (helmValuesSchema.maxItems ?? Infinity)
            )
        ) {
            return { "isValid": false, "bestApproximation": undefined };
        }

        if (helmValuesSchema.items === undefined) {
            return { "isValid": true };
        }

        for (const value_i of value) {
            const validationResult = validateValueAgainstJSONSchema_noEnumCheck({
                "helmValuesSchema": helmValuesSchema.items,
                "value": value_i
            });

            if (!validationResult.isValid) {
                return {
                    "isValid": false,
                    "bestApproximation": undefined
                };
            }
        }

        return { "isValid": true };
    }

    resolved_value_is_object: {
        if (typeof value !== "object") {
            break resolved_value_is_object;
        }

        if (helmValuesSchema.type !== "object") {
            break use_x_onyxia_overwriteDefaultWith;
        }

        return value;
    }
}
