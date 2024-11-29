import type { FormFieldGroup, FormField } from "../formTypes";
import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { Stringifyable } from "core/tools/Stringifyable";
import { createTemporaryRangeSlider } from "./mergeRangeSliders";
import { assert, type Equals } from "tsafe/assert";
import { id } from "tsafe/id";
import {
    onyxiaReservedPropertyNameInFieldDescription,
    type XOnyxiaParams
} from "core/ports/OnyxiaApi/XOnyxia";
import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";
import { same } from "evt/tools/inDepth/same";
import { isAmong } from "tsafe/isAmong";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import {
    resolveEnum,
    type JSONSchemaLike as JSONSchemaLike_resolveEnum
} from "../shared/resolveEnum";
import {
    getJSONSchemaType,
    type JSONSchemaLike as JSONSchemaLike_getJSONSchemaType
} from "../shared/getJSONSchemaType";

type XOnyxiaParamsLike = {
    hidden?: boolean;
    readonly?: boolean;
};

assert<keyof XOnyxiaParamsLike extends keyof XOnyxiaParams ? true : false>();
assert<XOnyxiaParams extends XOnyxiaParamsLike ? true : false>();

export type JSONSchemaLike = JSONSchemaLike_getJSONSchemaType &
    JSONSchemaLike_resolveEnum & {
        title?: string;
        description?: string;
        minItems?: number;
        maxItems?: number;
        hidden?:
            | boolean
            | { value: Stringifyable; path: string; isPathRelative?: boolean };
        items?: JSONSchemaLike;
        const?: Stringifyable;
        render?: "textArea" | "password" | "list" | "slider";
        sliderMax?: number;
        sliderMin?: number;
        sliderUnit?: string;
        sliderStep?: number;
        sliderExtremitySemantic?: string;
        sliderRangeId?: string;
        sliderExtremity?: "down" | "up";
        properties?: Record<string, JSONSchemaLike>;
        [onyxiaReservedPropertyNameInFieldDescription]?: XOnyxiaParamsLike;
    };

assert<keyof JSONSchemaLike extends keyof JSONSchema ? true : false>();
assert<JSONSchema extends JSONSchemaLike ? true : false>();

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type XOnyxiaContextLike = {};

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export function computeRootFormFieldGroup(params: {
    helmValuesSchema: JSONSchemaLike;
    helmValues: Stringifyable;
    xOnyxiaContext: XOnyxiaContextLike;
}): FormFieldGroup {
    const { helmValuesSchema, helmValues, xOnyxiaContext } = params;

    const formFieldGroup = computeRootFormFieldGroup_rec({
        helmValuesSchema,
        helmValues,
        xOnyxiaContext,
        helmValuesPath: []
    });

    assert(formFieldGroup.type === "group");

    return formFieldGroup;
}

function computeRootFormFieldGroup_rec(params: {
    helmValuesSchema: JSONSchemaLike;
    helmValues: Stringifyable;
    xOnyxiaContext: XOnyxiaContextLike;
    helmValuesPath: (string | number)[];
}): FormFieldGroup | FormField {
    const { helmValuesSchema, helmValues, xOnyxiaContext, helmValuesPath } = params;

    const isHidden: boolean = (() => {
        root_hidden: {
            const { hidden } = helmValuesSchema;

            if (hidden === undefined) {
                break root_hidden;
            }

            if (hidden === false) {
                break root_hidden;
            }

            if (hidden === true) {
                return true;
            }

            const { value, path, isPathRelative = false } = hidden;

            const splittedPath = path.split("/");

            const helmValuesPath_target = isPathRelative
                ? [...helmValuesPath.slice(0, -1), ...splittedPath]
                : splittedPath;

            const value_target = getValueAtPathInObject<Stringifyable>({
                obj: helmValues,
                path: helmValuesPath_target
            });

            if (!same(value, value_target)) {
                break root_hidden;
            }

            return true;
        }

        if (helmValuesSchema["x-onyxia"]?.hidden === true) {
            return true;
        }

        return false;
    })();

    const title = (() => {
        const { title } = helmValuesSchema;

        if (title !== undefined) {
            return title;
        }

        const lastSegment = helmValuesPath[helmValuesPath.length - 1];

        if (lastSegment === undefined) {
            return "<root>";
        }

        if (typeof lastSegment === "string") {
            return lastSegment;
        }

        const secondToLastSegment = helmValuesPath[helmValuesPath.length - 2];

        if (secondToLastSegment === undefined) {
            return `item ${lastSegment}`;
        }

        return `${secondToLastSegment} ${lastSegment}`;
    })();

    const isReadonly =
        (helmValuesSchema["x-onyxia"]?.readonly ?? false) ||
        helmValuesSchema.const !== undefined;

    const getValue = () => {
        const value = getValueAtPathInObject<Stringifyable>({
            obj: helmValues,
            path: helmValuesPath
        });

        assert(value !== undefined);

        return value;
    };

    const helmValuesSchemaType = getJSONSchemaType(helmValuesSchema);

    yaml_code_block: {
        if (!isAmong(["object", "array"], helmValuesSchemaType)) {
            break yaml_code_block;
        }

        if (helmValuesSchemaType === "array" && helmValuesSchema.items !== undefined) {
            break yaml_code_block;
        }

        if (
            helmValuesSchemaType === "object" &&
            helmValuesSchema.properties !== undefined
        ) {
            break yaml_code_block;
        }

        return id<FormField.YamlCodeBlock>({
            type: "field",
            isReadonly,
            title,
            fieldType: "yaml code block",
            helmValuesPath,
            description: helmValuesSchema.description,
            expectedDataType: helmValuesSchemaType,
            value: (() => {
                const value = getValue();

                assert(value instanceof Object);

                return value;
            })(),
            isHidden
        });
    }

    select: {
        const options = resolveEnum({
            helmValuesSchema,
            xOnyxiaContext
        });

        if (options === undefined) {
            break select;
        }

        return id<FormField.Select>({
            type: "field",
            title,
            isReadonly,
            fieldType: "select",
            helmValuesPath,
            description: helmValuesSchema.description,
            options,
            selectedOptionIndex: (() => {
                const selectedOption = getValue();

                const selectedOptionIndex = options.findIndex(option =>
                    same(option, selectedOption)
                );

                assert(selectedOptionIndex !== -1);

                return selectedOptionIndex;
            })(),
            isHidden
        });
    }

    simple_slider: {
        if (helmValuesSchema.sliderMin === undefined) {
            break simple_slider;
        }

        if (helmValuesSchema.sliderExtremity !== undefined) {
            break simple_slider;
        }

        assert(helmValuesSchemaType === "string" || helmValuesSchemaType === "number");
        assert(
            helmValuesSchema.render === undefined || helmValuesSchema.render === "slider"
        );

        const { sliderMin, sliderMax, sliderUnit, sliderStep } = helmValuesSchema;

        assert(sliderMin !== undefined);
        assert(sliderMax !== undefined);

        return id<FormField.Slider>({
            type: "field",
            title,
            isReadonly,
            fieldType: "slider",
            helmValuesPath,
            description: helmValuesSchema.description,
            min: sliderMin,
            max: sliderMax,
            unit: sliderUnit,
            step: sliderStep,
            value: (() => {
                const value = getValue();

                switch (typeof value) {
                    case "number": {
                        assert(sliderUnit === undefined);

                        return value;
                    }
                    case "string": {
                        const xStr =
                            sliderUnit === undefined || sliderUnit === ""
                                ? value
                                : value.slice(0, -sliderUnit.length);

                        const x = parseFloat(xStr);

                        assert(!isNaN(x));

                        return x;
                    }
                }

                assert(false);
            })(),
            isHidden
        });
    }

    range_slider: {
        if (helmValuesSchema.sliderExtremity === undefined) {
            break range_slider;
        }

        assert(helmValuesSchemaType === "string" || helmValuesSchemaType === "number");
        assert(
            helmValuesSchema.render === undefined || helmValuesSchema.render === "slider"
        );

        const {
            sliderMin,
            sliderMax,
            sliderUnit,
            sliderStep,
            sliderExtremitySemantic,
            sliderRangeId,
            sliderExtremity
        } = helmValuesSchema;

        assert(sliderMin !== undefined);
        assert(sliderMax !== undefined);
        assert(sliderRangeId !== undefined);

        return id<FormField.RangeSlider>(
            createTemporaryRangeSlider({
                payload: {
                    isReadonly,
                    sliderMin,
                    sliderMax,
                    sliderStep,
                    sliderUnit,
                    sliderExtremitySemantic,
                    sliderRangeId,
                    helmValue: (() => {
                        const value = getValue();

                        assert(typeof value === "number" || typeof value === "string");

                        return value;
                    })(),
                    helmValuesPath,
                    description: helmValuesSchema.description,
                    isHidden,
                    ...(() => {
                        switch (sliderExtremity) {
                            case "down":
                                return { sliderExtremity: "down", title };
                            case "up":
                                return { sliderExtremity: "up" };
                        }
                        assert<Equals<typeof sliderExtremity, never>>(false);
                    })()
                }
            })
        );
    }

    switch (helmValuesSchemaType) {
        case "object": {
            assert(helmValuesSchema.properties !== undefined);

            const nodes = Object.entries(helmValuesSchema.properties).map(
                ([segment, helmValuesSchema_child]) =>
                    computeRootFormFieldGroup_rec({
                        helmValues,
                        helmValuesPath: [...helmValuesPath, segment],
                        xOnyxiaContext,
                        helmValuesSchema: helmValuesSchema_child
                    })
            );

            return id<FormFieldGroup>({
                type: "group",
                helmValuesPath,
                title,
                description: helmValuesSchema.description,
                nodes,
                canAdd: false,
                canRemove: false,
                isHidden: isHidden || nodes.every(node => node.isHidden)
            });
        }
        case "array": {
            const itemSchema = helmValuesSchema.items;

            assert(itemSchema !== undefined);

            const values = getValueAtPathInObject<Stringifyable>({
                obj: helmValues,
                path: helmValuesPath
            });

            assert(values !== undefined);
            assert(values instanceof Array);

            const nodes = values.map((...[, index]) =>
                computeRootFormFieldGroup_rec({
                    helmValues,
                    helmValuesPath: [...helmValuesPath, index],
                    xOnyxiaContext,
                    helmValuesSchema: itemSchema
                })
            );

            return id<FormFieldGroup>({
                type: "group",
                helmValuesPath,
                title,
                description: helmValuesSchema.description,
                nodes,
                canAdd: values.length < (helmValuesSchema.maxItems ?? Infinity),
                canRemove: values.length > (helmValuesSchema.minItems ?? 0),
                isHidden: isHidden || nodes.every(node => node.isHidden)
            });
        }
        case "boolean":
            return id<FormField.Checkbox>({
                type: "field",
                title,
                isReadonly,
                fieldType: "checkbox",
                helmValuesPath,
                description: helmValuesSchema.description,
                value: (() => {
                    const value = getValue();

                    assert(typeof value === "boolean");

                    return value;
                })(),
                isHidden
            });
        case "string":
            return id<FormField.TextField>({
                type: "field",
                title,
                isReadonly,
                fieldType: "text field",
                helmValuesPath,
                description: helmValuesSchema.description,
                doRenderAsTextArea: helmValuesSchema.render === "textArea",
                isSensitive: helmValuesSchema.render === "password",
                pattern: helmValuesSchema.pattern,
                value: (() => {
                    const value = getValue();

                    assert(typeof value === "string");

                    return value;
                })(),
                isHidden
            });
        case "integer":
        case "number":
            return id<FormField.NumberField>({
                type: "field",
                title,
                isReadonly,
                fieldType: "number field",
                helmValuesPath,
                description: helmValuesSchema.description,
                value: (() => {
                    const value = getValue();

                    assert(typeof value === "number");

                    return value;
                })(),
                isInteger: helmValuesSchemaType === "integer",
                minimum: helmValuesSchema.minimum,
                isHidden
            });
    }

    assert<Equals<typeof helmValuesSchemaType, never>>();
}
