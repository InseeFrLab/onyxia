import {
    type JSONSchemaObject,
    type JSONSchemaFormFieldDescription,
    type XOnyxiaContext
} from "core/ports/OnyxiaApi";
import Mustache from "mustache";
import { assert } from "tsafe/assert";
import type { Equals } from "tsafe";
import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";

export function injectXOnyxiaContextInValuesSchemaJson(params: {
    xOnyxiaContext: XOnyxiaContext;
    valuesSchemaJsonBeforeInjection: JSONSchemaObject;
}): JSONSchemaObject {
    const { xOnyxiaContext, valuesSchemaJsonBeforeInjection } = params;

    //WARNING: The type is not exactly correct here. JSONSchemaFormFieldDescription["default"] can be undefined.
    const valuesSchemaJsonBeforeInjectionCopy = JSON.parse(
        JSON.stringify(valuesSchemaJsonBeforeInjection)
    ) as JSONSchemaObject;

    injectXOnyxiaContextInValuesSchemaJsonRec({
        xOnyxiaContext,
        "jsonSchemaObjectOrFormFieldDescription": valuesSchemaJsonBeforeInjectionCopy,
        "path": ""
    });

    return valuesSchemaJsonBeforeInjectionCopy;
}
function injectXOnyxiaContextInValuesSchemaJsonRec(params: {
    xOnyxiaContext: XOnyxiaContext;
    jsonSchemaObjectOrFormFieldDescription:
        | JSONSchemaObject
        | JSONSchemaFormFieldDescription;
    path: string;
}) {
    const { xOnyxiaContext, jsonSchemaObjectOrFormFieldDescription, path } = params;

    if (
        jsonSchemaObjectOrFormFieldDescription.type === "object" &&
        "properties" in jsonSchemaObjectOrFormFieldDescription
    ) {
        const jsonSchemaObject = jsonSchemaObjectOrFormFieldDescription;
        Object.entries(jsonSchemaObject.properties).forEach(([key, value]) =>
            injectXOnyxiaContextInValuesSchemaJsonRec({
                xOnyxiaContext,
                "jsonSchemaObjectOrFormFieldDescription": value,
                "path": `${path}.${key}`
            })
        );
        return;
    }

    const jsonSchemaFormFieldDescription = jsonSchemaObjectOrFormFieldDescription;

    overwrite_default: {
        const assertWeHaveADefault = () => {
            //NOTE: Actually, the default can be undefined in the value.schema.json
            //      but it would be too complicated to specify in the type system
            //      thus the any.
            if ((jsonSchemaFormFieldDescription.default as any) !== undefined) {
                return;
            }

            if (jsonSchemaFormFieldDescription.type === "string") {
                jsonSchemaFormFieldDescription.default = "";
                return;
            }

            if (jsonSchemaFormFieldDescription.type === "object") {
                jsonSchemaFormFieldDescription.default = {};
                return;
            }

            if (jsonSchemaFormFieldDescription.type === "array") {
                jsonSchemaFormFieldDescription.default = [];
                return;
            }

            assert(false, `${path} has no default value`);
        };

        const { overwriteDefaultWith } = jsonSchemaFormFieldDescription["x-onyxia"] ?? {};

        if (overwriteDefaultWith === undefined) {
            assertWeHaveADefault();
            break overwrite_default;
        }

        const resolvedValue = resolveXOnyxiaValueReference({
            xOnyxiaContext,
            "expression": overwriteDefaultWith
        });

        if (resolvedValue === undefined || resolvedValue === null) {
            assertWeHaveADefault();
            break overwrite_default;
        }

        switch (jsonSchemaFormFieldDescription.type) {
            case "string":
                jsonSchemaFormFieldDescription.default =
                    typeof resolvedValue !== "object"
                        ? `${resolvedValue}`
                        : JSON.stringify(resolvedValue);
                break;
            case "array":
                assert(
                    resolvedValue instanceof Array,
                    `${overwriteDefaultWith} is not an array (${path})`
                );
                jsonSchemaFormFieldDescription.default = resolvedValue;
                break;
            case "object":
                assert(
                    resolvedValue instanceof Object,
                    `${overwriteDefaultWith} is not an object (${path})`
                );
                jsonSchemaFormFieldDescription.default = resolvedValue;
                break;
            case "boolean":
                {
                    assert(
                        typeof resolvedValue !== "object",
                        `${overwriteDefaultWith} resolved to an object, it can't be interpreted as a boolean (${path})`
                    );

                    const trueishStrings = ["true", "1", "yes", "y"];
                    const falseishStrings = ["false", "0", "no", "n"];

                    if (typeof resolvedValue === "string") {
                        assert(
                            [...trueishStrings, ...falseishStrings].includes(
                                resolvedValue.toLowerCase()
                            ),
                            [
                                `${overwriteDefaultWith} resolves to a string that can't be interpreted as a boolean (${path})`,
                                `strings that can be interpreted as boolean are: (case insensitive)`,
                                [...trueishStrings, ...falseishStrings].join(" "),
                                `You resolved to: ${resolvedValue}`
                            ].join("\n")
                        );
                    }

                    jsonSchemaFormFieldDescription.default =
                        typeof resolvedValue === "string"
                            ? trueishStrings.includes(resolvedValue.toLowerCase())
                            : !!resolvedValue;
                }
                break;
            case "number":
            case "integer":
                {
                    const x = (() => {
                        if (typeof resolvedValue === "number") {
                            return resolvedValue;
                        }

                        const interpretedValue =
                            typeof resolvedValue === "string"
                                ? parseFloat(resolvedValue)
                                : undefined;

                        assert(
                            interpretedValue !== undefined && !isNaN(interpretedValue),
                            `${overwriteDefaultWith} can't be interpreted as a number (${path})`
                        );

                        return interpretedValue;
                    })();

                    jsonSchemaFormFieldDescription.default = (() => {
                        switch (jsonSchemaFormFieldDescription.type) {
                            case "number":
                                return x;
                            case "integer":
                                assert(
                                    Number.isInteger(x),
                                    `${overwriteDefaultWith} (${x}) is not an integer (${path})`
                                );
                                return x;
                        }
                    })();
                }
                break;
        }
    }

    overwrite_list_enum: {
        const { overwriteListEnumWith } =
            jsonSchemaFormFieldDescription["x-onyxia"] ?? {};

        if (overwriteListEnumWith === undefined) {
            break overwrite_list_enum;
        }

        const resolvedValue = resolveXOnyxiaValueReference({
            xOnyxiaContext,
            "expression": overwriteListEnumWith
        });

        if (resolvedValue === undefined || resolvedValue === null) {
            break overwrite_list_enum;
        }

        if (!(resolvedValue instanceof Array)) {
            console.warn(
                `${JSON.stringify(overwriteListEnumWith)} is not an array (${path})`
            );
            break overwrite_list_enum;
        }

        jsonSchemaFormFieldDescription.listEnum = resolvedValue;
    }

    use_region_slider_config: {
        if (
            !(
                jsonSchemaFormFieldDescription.type === "string" &&
                "render" in jsonSchemaFormFieldDescription &&
                jsonSchemaFormFieldDescription.render === "slider"
            )
        ) {
            break use_region_slider_config;
        }

        const { useRegionSliderConfig } =
            jsonSchemaFormFieldDescription["x-onyxia"] ?? {};

        if (useRegionSliderConfig === undefined) {
            break use_region_slider_config;
        }

        const sliderConfig = getValueAtPathInObject<
            (typeof xOnyxiaContext)["region"]["sliders"][string]
        >({
            "path": ["region", "sliders", useRegionSliderConfig],
            "obj": xOnyxiaContext
        });

        if (sliderConfig === undefined) {
            console.warn(
                `There is no slider configuration ${useRegionSliderConfig} in the current deployment region`
            );
            break use_region_slider_config;
        }

        const { sliderMax, sliderMin, sliderStep, sliderUnit, ...rest } = sliderConfig;

        assert<Equals<typeof rest, {}>>();

        if ("sliderExtremity" in jsonSchemaFormFieldDescription) {
            switch (jsonSchemaFormFieldDescription.sliderExtremity) {
                case "down":
                    jsonSchemaFormFieldDescription.sliderMin = sliderConfig.sliderMin;
                    jsonSchemaFormFieldDescription.sliderUnit = sliderConfig.sliderUnit;
                    jsonSchemaFormFieldDescription.sliderStep = sliderConfig.sliderStep;
                    break;
                case "up":
                    jsonSchemaFormFieldDescription.sliderMax = sliderConfig.sliderMax;
                    break;
            }
        } else {
            jsonSchemaFormFieldDescription.sliderMax = sliderConfig.sliderMax;
            jsonSchemaFormFieldDescription.sliderMin = sliderConfig.sliderMin;
            jsonSchemaFormFieldDescription.sliderUnit = sliderConfig.sliderUnit;
            jsonSchemaFormFieldDescription.sliderStep = sliderConfig.sliderStep;
        }
    }
}

const { resolveXOnyxiaValueReference } = (() => {
    type Params = {
        expression: unknown;
        xOnyxiaContext: XOnyxiaContext;
    };

    function resolveXOnyxiaValueReference_rec(
        params: Params & { isRoot: boolean }
    ): unknown {
        const { isRoot, expression: expression_unknown, xOnyxiaContext } = params;

        if (typeof expression_unknown === "string") {
            const expression_str = !isRoot
                ? expression_unknown
                : expression_unknown.replace(/\[(\d+)\]/g, ".$1"); // convert 'a.b[0].c' to 'a.b.0.c'

            full_substitution: {
                const match = expression_str.match(/^{{([^}]+)}}$/);

                if (match === null) {
                    break full_substitution;
                }

                return getValueAtPathInObject({
                    "path": match[1].split("."),
                    "obj": xOnyxiaContext
                });
            }

            string_substitution: {
                if (!expression_str.includes("{{")) {
                    break string_substitution;
                }

                return Mustache.render(
                    expression_str.replace(/{{/g, "{{{").replace(/}}/g, "}}}"),
                    xOnyxiaContext
                );
            }

            implicit_reference: {
                if (!isRoot) {
                    break implicit_reference;
                }

                return resolveXOnyxiaValueReference_rec({
                    "expression": `{{${expression_str}}}`,
                    xOnyxiaContext,
                    "isRoot": true
                });
            }

            return expression_str;
        }

        if (expression_unknown instanceof Array) {
            return expression_unknown.map(entry =>
                resolveXOnyxiaValueReference_rec({
                    "expression": entry,
                    "isRoot": false,
                    xOnyxiaContext
                })
            );
        }

        if (expression_unknown instanceof Object) {
            return Object.fromEntries(
                Object.entries(expression_unknown).map(([key, value]) => [
                    key,
                    resolveXOnyxiaValueReference_rec({
                        "expression": value,
                        "isRoot": false,
                        xOnyxiaContext
                    })
                ])
            );
        }

        return expression_unknown;
    }

    function resolveXOnyxiaValueReference(params: Params): unknown {
        const { expression, xOnyxiaContext } = params;
        return resolveXOnyxiaValueReference_rec({
            expression,
            xOnyxiaContext,
            "isRoot": true
        });
    }

    return { resolveXOnyxiaValueReference };
})();
