import {
    onyxiaReservedPropertyNameInFieldDescription,
    type XOnyxiaParams
} from "core/ports/OnyxiaApi/XOnyxia";
import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import { assert, type Equals } from "tsafe/assert";
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
import {
    computeDiff,
    applyDiffPatch,
    getValueAtPath,
    type Stringifyable
} from "core/tools/Stringifyable";

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
        additionalProperties?: boolean | Record<string, Stringifyable>;
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
    infoAmountInHelmValues: "user provided" | "include values.yaml defaults";
}): {
    helmValues: Record<string, Stringifyable>;
    helmValuesSchema_forDataTextEditor: JSONSchemaLike;
    isChartUsingS3: boolean;
} {
    const { helmValuesSchema, helmValuesYaml, xOnyxiaContext, infoAmountInHelmValues } =
        params;

    const helmValuesSchema_forDataTextEditor = structuredClone(helmValuesSchema);

    editHelmValuesSchemaForDataTextEditor({
        helmValuesSchema,
        helmValuesSchema_forDataTextEditor,
        xOnyxiaContext
    });

    let isChartUsingS3 = false;

    const helmValuesYaml_parsed = (() => {
        const helmValuesYaml_parsed = YAML.parse(helmValuesYaml);

        assert(
            helmValuesYaml_parsed instanceof Object &&
                !(helmValuesYaml_parsed instanceof Array)
        );

        return helmValuesYaml_parsed;
    })();

    const helmValues = computeHelmValues_rec({
        helmValuesSchema,
        helmValuesSchema_forDataTextEditor,
        helmValuesYaml_parsed,
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

    if (infoAmountInHelmValues === "include values.yaml defaults") {
        const { diffPatch } = computeDiff({
            before: helmValues,
            current: helmValuesYaml_parsed
        });

        applyDiffPatch({
            objectOrArray: helmValues,
            diffPatch: diffPatch.filter(({ path }) => {
                const value_current = getValueAtPath(helmValues, path);

                if (value_current !== undefined) {
                    return false;
                }

                return true;
            })
        });
    } else {
        assert<Equals<typeof infoAmountInHelmValues, "user provided">>();
    }

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

    const helmValuesSchemaType = getJSONSchemaType(helmValuesSchema);

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

    schema_is_object_with_known_properties: {
        if (helmValuesSchemaType !== "object") {
            break schema_is_object_with_known_properties;
        }

        const { properties } = helmValuesSchema;

        if (properties === undefined) {
            break schema_is_object_with_known_properties;
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

        let resolvedValue = resolveXOnyxiaValueReference({
            expression: overwriteDefaultWith,
            xOnyxiaContext
        });

        if (resolvedValue === undefined) {
            break use_x_onyxia_overwriteDefaultWith;
        }

        array_mapping: {
            if (helmValuesSchemaType !== "array") {
                break array_mapping;
            }

            if (!(resolvedValue instanceof Array)) {
                break array_mapping;
            }

            const { items } = helmValuesSchema;

            if (items === undefined) {
                break array_mapping;
            }

            if (items.properties === undefined) {
                break array_mapping;
            }

            if (getJSONSchemaType(items) !== "object") {
                break array_mapping;
            }

            const items_cloned = structuredClone(items);

            assert(items_cloned.properties !== undefined);

            for (const [propertyName, value] of Object.entries(items_cloned.properties)) {
                (value["x-onyxia"] ??= {}).overwriteDefaultWith ??= `{{${propertyName}}}`;
            }

            const resolvedValue_new: typeof resolvedValue = [];

            for (const resolvedValue_i of resolvedValue) {
                if (
                    !(resolvedValue_i instanceof Object) ||
                    resolvedValue_i instanceof Array
                ) {
                    break array_mapping;
                }

                let resolvedValue_i_mapped;

                try {
                    resolvedValue_i_mapped = computeHelmValues_rec({
                        helmValuesSchema: items_cloned,
                        helmValuesSchema_forDataTextEditor: undefined,
                        helmValuesYaml_parsed: undefined,
                        xOnyxiaContext: new Proxy(xOnyxiaContext, {
                            get(...args) {
                                const [, prop] = args;

                                if (typeof prop === "string" && prop in resolvedValue_i) {
                                    return resolvedValue_i[prop];
                                }
                                return Reflect.get(...args);
                            }
                        })
                    });
                } catch {
                    break array_mapping;
                }

                resolvedValue_new.push(resolvedValue_i_mapped);
            }

            resolvedValue = resolvedValue_new;
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

function editHelmValuesSchemaForDataTextEditor(params: {
    helmValuesSchema: JSONSchemaLike;
    xOnyxiaContext: XOnyxiaContextLike_computeHelmValues_rec;
    helmValuesSchema_forDataTextEditor: JSONSchemaLike | undefined;
}): void {
    const { helmValuesSchema, xOnyxiaContext, helmValuesSchema_forDataTextEditor } =
        params;

    const helmValuesSchemaType = getJSONSchemaType(helmValuesSchema);

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

        add_required_object: {
            if (helmValuesSchemaType !== "object") {
                break add_required_object;
            }

            const { properties } = helmValuesSchema;

            if (properties === undefined) {
                break add_required_object;
            }

            helmValuesSchema_forDataTextEditor.required = Object.keys(properties);

            helmValuesSchema_forDataTextEditor.additionalProperties = false;
        }

        add_required_properties_for_dataTextEditor: {
            const { items } = helmValuesSchema;

            if (items === undefined) {
                break add_required_properties_for_dataTextEditor;
            }

            assert(helmValuesSchema_forDataTextEditor.items !== undefined);

            if (items.properties === undefined) {
                break add_required_properties_for_dataTextEditor;
            }

            helmValuesSchema_forDataTextEditor.items.required = Object.keys(
                items.properties
            );

            helmValuesSchema_forDataTextEditor.items.additionalProperties = false;
        }
    }

    schema_is_object_with_known_properties: {
        if (helmValuesSchemaType !== "object") {
            break schema_is_object_with_known_properties;
        }

        const { properties } = helmValuesSchema;

        if (properties === undefined) {
            break schema_is_object_with_known_properties;
        }

        Object.entries(properties).forEach(([propertyName, propertySchema]) => {
            editHelmValuesSchemaForDataTextEditor({
                helmValuesSchema: propertySchema,
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
            });
        });

        return;
    }

    schema_is_array: {
        if (helmValuesSchemaType !== "array") {
            break schema_is_array;
        }

        const { items } = helmValuesSchema;

        if (items === undefined) {
            break schema_is_array;
        }

        try {
            editHelmValuesSchemaForDataTextEditor({
                helmValuesSchema: items,
                xOnyxiaContext,
                helmValuesSchema_forDataTextEditor: (() => {
                    if (helmValuesSchema_forDataTextEditor === undefined) {
                        return undefined;
                    }

                    const { items: items_resolved } = helmValuesSchema_forDataTextEditor;

                    assert(items_resolved !== undefined);

                    return items_resolved;
                })()
            });
        } catch {
            return undefined;
        }
    }
}
