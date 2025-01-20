import {
    onyxiaReservedPropertyNameInFieldDescription,
    type XOnyxiaParams
} from "core/ports/OnyxiaApi/XOnyxia";
import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import type { Stringifyable } from "core/tools/Stringifyable";
import { assert } from "tsafe/assert";
import {
    resolveXOnyxiaValueReference,
    type XOnyxiaContextLike as XOnyxiaContextLike_resolveXOnyxiaValueReference
} from "./shared/resolveXOnyxiaValueReference";
import YAML from "yaml";
import {
    validateValueAgainstJSONSchema,
    type JSONSchemaLike as JSONSchemaLike_validateValueAgainstJSONSchema,
    type XOnyxiaContextLike as XOnyxiaContextLike_validateValueAgainstJSONSchema
} from "./shared/validateValueAgainstJSONSchema";
import { resolveEnum } from "./shared/resolveEnum";
import {
    getJSONSchemaType,
    type JSONSchemaLike as JSONSchemaLike_getJSONSchemaType
} from "./shared/getJSONSchemaType";
import structuredClone from "@ungap/structured-clone";

type XOnyxiaParamsLike = {
    overwriteDefaultWith?: XOnyxiaParams["overwriteDefaultWith"];
};

assert<keyof XOnyxiaParamsLike extends keyof XOnyxiaParams ? true : false>();
assert<XOnyxiaParams extends XOnyxiaParamsLike ? true : false>();

export type JSONSchemaLike = JSONSchemaLike_getJSONSchemaType &
    JSONSchemaLike_validateValueAgainstJSONSchema & {
        items?: JSONSchemaLike;
        minItems?: number;
        default?: Stringifyable;
        const?: Stringifyable;
        properties?: Record<string, JSONSchemaLike>;
        required?: string[];
        enum?: Stringifyable[];
        [onyxiaReservedPropertyNameInFieldDescription]?: XOnyxiaParamsLike;
    };

assert<keyof JSONSchemaLike extends keyof JSONSchema ? true : false>();
assert<JSONSchema extends JSONSchemaLike ? true : false>();

export type XOnyxiaContextLike = XOnyxiaContextLike_computeHelmValues_rec & {
    s3: unknown;
};

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export function computeHelmValues(params: {
    helmValuesSchema: JSONSchemaLike;
    helmValuesYaml: string;
    xOnyxiaContext: XOnyxiaContextLike;
}): {
    helmValues: Record<string, Stringifyable>;
    helmValuesSchema_forDataTextEditor: JSONSchemaLike;
    isChartUsingS3: boolean;
} {
    const { helmValuesSchema, helmValuesYaml, xOnyxiaContext } = params;

    const helmValuesSchema_forDataTextEditor = structuredClone(helmValuesSchema);

    let isChartUsingS3 = false;

    const helmValues = computeHelmValues_rec({
        helmValuesSchema,
        helmValuesSchema_forDataTextEditor,
        helmValuesYaml_parsed: (() => {
            const helmValuesYaml_parsed = YAML.parse(helmValuesYaml);

            assert(
                helmValuesYaml_parsed instanceof Object &&
                    !(helmValuesYaml_parsed instanceof Array)
            );

            return helmValuesYaml_parsed;
        })(),
        xOnyxiaContext: (() => {
            const s3PropertyName = "s3";

            assert<
                typeof s3PropertyName extends keyof XOnyxiaContextLike ? true : false
            >();

            return new Proxy(xOnyxiaContext, {
                get: (...args) => {
                    const [, prop] = args;
                    if (prop === s3PropertyName) {
                        isChartUsingS3 = true;
                    }
                    return Reflect.get(...args);
                }
            });
        })()
    });

    assert(helmValues instanceof Object && !(helmValues instanceof Array));

    return { helmValues, isChartUsingS3, helmValuesSchema_forDataTextEditor };
}

export type XOnyxiaContextLike_computeHelmValues_rec =
    XOnyxiaContextLike_resolveXOnyxiaValueReference &
        XOnyxiaContextLike_validateValueAgainstJSONSchema & {};

assert<XOnyxiaContext extends XOnyxiaContextLike_computeHelmValues_rec ? true : false>();

export function computeHelmValues_rec(params: {
    helmValuesSchema: JSONSchemaLike;
    helmValuesYaml_parsed: Stringifyable | undefined;
    xOnyxiaContext: XOnyxiaContextLike_computeHelmValues_rec;
    helmValuesSchema_forDataTextEditor: JSONSchemaLike | undefined;
}): Stringifyable {
    const {
        helmValuesSchema,
        helmValuesYaml_parsed,
        xOnyxiaContext,
        helmValuesSchema_forDataTextEditor
    } = params;

    for_text_editor_only: {
        if (helmValuesSchema_forDataTextEditor === undefined) {
            break for_text_editor_only;
        }

        delete helmValuesSchema_forDataTextEditor.listEnum;
        delete helmValuesSchema_forDataTextEditor["x-onyxia"];
        delete helmValuesSchema_forDataTextEditor.render;

        {
            const resolvedEnum = resolveEnum({
                helmValuesSchema,
                xOnyxiaContext
            });

            if (resolvedEnum !== undefined) {
                helmValuesSchema_forDataTextEditor.enum = resolvedEnum;
            }
        }
    }

    use_const: {
        const constValue = helmValuesSchema.const;

        if (constValue === undefined) {
            break use_const;
        }

        const { isValid } = validateValueAgainstJSONSchema({
            helmValuesSchema,
            xOnyxiaContext,
            value: constValue
        });

        assert(isValid);

        if (helmValuesSchema_forDataTextEditor !== undefined) {
            delete helmValuesSchema_forDataTextEditor.default;
        }

        return constValue;
    }

    const helmValuesSchemaType = getJSONSchemaType(helmValuesSchema);

    schema_is_object_with_known_properties: {
        if (helmValuesSchemaType !== "object") {
            break schema_is_object_with_known_properties;
        }

        const { properties } = helmValuesSchema;

        if (properties === undefined) {
            break schema_is_object_with_known_properties;
        }

        if (helmValuesSchema_forDataTextEditor !== undefined) {
            helmValuesSchema_forDataTextEditor.required = Object.keys(properties);
        }

        return Object.fromEntries(
            Object.entries(properties).map(([propertyName, propertySchema]) => [
                propertyName,
                computeHelmValues_rec({
                    helmValuesSchema: propertySchema,
                    helmValuesYaml_parsed:
                        helmValuesYaml_parsed instanceof Object &&
                        !(helmValuesYaml_parsed instanceof Array)
                            ? helmValuesYaml_parsed[propertyName]
                            : undefined,
                    xOnyxiaContext,
                    helmValuesSchema_forDataTextEditor: (() => {
                        if (helmValuesSchema_forDataTextEditor === undefined) {
                            return undefined;
                        }

                        const { properties: property_forDataTextEditor } =
                            helmValuesSchema_forDataTextEditor;

                        assert(property_forDataTextEditor !== undefined);

                        const out = property_forDataTextEditor[propertyName];

                        assert(out !== undefined, "crash");

                        return out;
                    })()
                })
            ])
        );
    }

    use_x_onyxia_overwriteDefaultWith: {
        const { overwriteDefaultWith } = helmValuesSchema["x-onyxia"] ?? {};

        if (overwriteDefaultWith === undefined) {
            break use_x_onyxia_overwriteDefaultWith;
        }

        const resolvedValue = resolveXOnyxiaValueReference({
            expression: overwriteDefaultWith,
            xOnyxiaContext
        });

        if (resolvedValue === undefined) {
            break use_x_onyxia_overwriteDefaultWith;
        }

        const validationResult = validateValueAgainstJSONSchema({
            helmValuesSchema,
            xOnyxiaContext,
            value: resolvedValue
        });

        if (!validationResult.isValid) {
            if (validationResult.reasonableApproximation === undefined) {
                break use_x_onyxia_overwriteDefaultWith;
            }

            if (helmValuesSchema_forDataTextEditor !== undefined) {
                helmValuesSchema_forDataTextEditor.default =
                    validationResult.reasonableApproximation;
            }

            return validationResult.reasonableApproximation;
        }

        if (helmValuesSchema_forDataTextEditor !== undefined) {
            helmValuesSchema_forDataTextEditor.default = resolvedValue;
        }

        return resolvedValue;
    }

    use_default: {
        const defaultValue = helmValuesSchema.default;

        if (defaultValue === undefined) {
            break use_default;
        }

        const { isValid } = validateValueAgainstJSONSchema({
            helmValuesSchema,
            xOnyxiaContext,
            value: defaultValue
        });

        if (!isValid) {
            break use_default;
        }

        return defaultValue;
    }

    use_values_yaml: {
        if (helmValuesYaml_parsed === undefined) {
            break use_values_yaml;
        }

        const { isValid } = validateValueAgainstJSONSchema({
            helmValuesSchema,
            xOnyxiaContext,
            value: helmValuesYaml_parsed
        });

        assert(isValid);

        if (helmValuesSchema_forDataTextEditor !== undefined) {
            helmValuesSchema_forDataTextEditor.default = helmValuesYaml_parsed;
        }

        return helmValuesYaml_parsed;
    }

    schema_is_array: {
        if (helmValuesSchemaType !== "array") {
            break schema_is_array;
        }

        const candidateArray: Stringifyable[] = [];

        fill_with_items_default: {
            const { minItems } = helmValuesSchema;

            if (minItems === undefined || minItems === 0) {
                break fill_with_items_default;
            }

            const defaultItem = (() => {
                const { items } = helmValuesSchema;

                if (items === undefined) {
                    return undefined;
                }

                let defaultItem;

                try {
                    defaultItem = computeHelmValues_rec({
                        helmValuesSchema: items,
                        helmValuesYaml_parsed: undefined,
                        xOnyxiaContext,
                        helmValuesSchema_forDataTextEditor: (() => {
                            if (helmValuesSchema_forDataTextEditor === undefined) {
                                return undefined;
                            }

                            const { items: items_resolved } =
                                helmValuesSchema_forDataTextEditor;

                            assert(items_resolved !== undefined);

                            return items_resolved;
                        })()
                    });
                } catch {
                    return undefined;
                }

                return defaultItem;
            })();

            assert(
                defaultItem !== undefined,
                "We have no default items yet we have a minItems value"
            );

            for (let i = 0; i < minItems; i++) {
                candidateArray.push(defaultItem);
            }
        }

        return candidateArray;
    }

    assert(false, `Can't resolve value ${JSON.stringify(params, null, 2)}`);
}
