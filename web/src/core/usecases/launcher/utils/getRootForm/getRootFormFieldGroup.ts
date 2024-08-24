import type { FormFieldGroup, FormField } from "../../formTypes";
import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { Stringifyable } from "core/tools/Stringifyable";
import { mergeRangeSliders } from "./mergeRangeSliders";
import { assert, type Equals } from "tsafe/assert";
import { id } from "tsafe/id";
import {
    onyxiaReservedPropertyNameInFieldDescription,
    type XOnyxiaParams
} from "core/ports/OnyxiaApi/XOnyxia";
import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";
import { exclude } from "tsafe/exclude";
import { same } from "evt/tools/inDepth/same";
import { isAmong } from "tsafe/isAmong";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import {
    resolveEnum,
    type JSONSchemaLike as JSONSchemaLike_resolveEnum
} from "../shared/resolveEnum";

type XOnyxiaParamsLike = {
    hidden?: boolean;
    readonly?: boolean;
};

assert<keyof XOnyxiaParamsLike extends keyof XOnyxiaParams ? true : false>();
assert<XOnyxiaParams extends XOnyxiaParamsLike ? true : false>();

export type JSONSchemaLike = JSONSchemaLike_resolveEnum & {
    type: "object" | "array" | "string" | "boolean" | "integer" | "number";
    title?: string;
    description?: string;
    hidden?: boolean | { value: Stringifyable; path: string; isPathRelative?: boolean };
    items?: JSONSchemaLike;
    const?: Stringifyable;
    properties?: Record<string, JSONSchemaLike>;
    [onyxiaReservedPropertyNameInFieldDescription]?: XOnyxiaParamsLike;
};

assert<keyof JSONSchemaLike extends keyof JSONSchema ? true : false>();
assert<JSONSchema extends JSONSchemaLike ? true : false>();

export type XOnyxiaContextLike = {
    s3: unknown;
};

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export function getRootFormFieldGroup(params: {
    helmValuesSchema: JSONSchemaLike;
    helmValues: Stringifyable;
    xOnyxiaContext: XOnyxiaContextLike;
}): FormFieldGroup {
    const { helmValuesSchema, helmValues, xOnyxiaContext } = params;

    const formFieldGroup = getRootFormFieldGroup_rec({
        helmValuesSchema,
        helmValues,
        xOnyxiaContext,
        "helmValuesPath": []
    });

    assert(formFieldGroup !== undefined);
    assert(formFieldGroup.type === "group");

    return formFieldGroup;
}

function getRootFormFieldGroup_rec(params: {
    helmValuesSchema: JSONSchemaLike;
    helmValues: Stringifyable;
    xOnyxiaContext: XOnyxiaContextLike;
    helmValuesPath: (string | number)[];
}): FormFieldGroup | FormField | undefined {
    const { helmValuesSchema, helmValues, xOnyxiaContext, helmValuesPath } = params;

    if (helmValuesSchema.const !== undefined) {
        return undefined;
    }

    root_hidden: {
        const { hidden } = helmValuesSchema;

        if (hidden === undefined) {
            break root_hidden;
        }

        if (hidden === false) {
            break root_hidden;
        }

        if (hidden === true) {
            return undefined;
        }

        const { value, path, isPathRelative = false } = hidden;

        const splittedPath = path.split("/");

        const helmValuesPath_target = isPathRelative
            ? [...helmValuesPath, ...splittedPath]
            : splittedPath;

        const value_target = getValueAtPathInObject<Stringifyable>({
            "obj": helmValues,
            "path": helmValuesPath_target
        });

        if (!same(value, value_target)) {
            break root_hidden;
        }

        return undefined;
    }

    if (helmValuesSchema.hidden) {
        return undefined;
    }

    if (helmValuesSchema["x-onyxia"]?.hidden === true) {
        return undefined;
    }

    const getTitle = () => {
        assert(helmValuesPath.length !== 0);

        const lastSegment = helmValuesPath[helmValuesPath.length - 1];

        let title =
            helmValuesSchema.title ??
            (() => {
                if (typeof lastSegment === "number") {
                    assert(helmValuesPath.length !== 1);

                    const secondToLastSegment = helmValuesPath[helmValuesPath.length - 2];

                    return `${secondToLastSegment}`;
                }

                return lastSegment;
            })();

        if (typeof lastSegment === "number") {
            title = `${title} ${lastSegment}`;
        }

        return title;
    };

    const isReadonly = helmValuesSchema["x-onyxia"]?.readonly ?? false;

    const getValue = () => {
        const value = getValueAtPathInObject<Stringifyable>({
            "obj": helmValues,
            "path": helmValuesPath
        });

        assert(value !== undefined);

        return value;
    };

    yaml_code_block: {
        if (!isAmong(["object", "array"], helmValuesSchema.type)) {
            break yaml_code_block;
        }

        if (helmValuesSchema.type === "array" && helmValuesSchema.items !== undefined) {
            break yaml_code_block;
        }

        if (
            helmValuesSchema.type === "object" &&
            helmValuesSchema.properties !== undefined
        ) {
            break yaml_code_block;
        }

        return id<FormField.YamlCodeBlock>({
            "type": "field",
            isReadonly,
            "title": getTitle(),
            "fieldType": "yaml code block",
            helmValuesPath,
            "description": helmValuesSchema.description,
            "expectedDataType": helmValuesSchema.type,
            "value": (() => {
                const value = getValue();

                assert(value instanceof Object);

                return value;
            })()
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
            "type": "field",
            "title": getTitle(),
            isReadonly,
            "fieldType": "select",
            helmValuesPath,
            "description": helmValuesSchema.description,
            options,
            "selectedOptionIndex": (() => {
                const selectedOption = getValue();

                const selectedOptionIndex = options.findIndex(option =>
                    same(option, selectedOption)
                );

                assert(selectedOptionIndex !== -1);

                return selectedOptionIndex;
            })()
        });
    }

    switch (helmValuesSchema.type) {
        case "object":
            assert(helmValuesSchema.properties !== undefined);
            return id<FormFieldGroup>({
                "type": "group",
                "helmValuesPathSegment":
                    helmValuesPath.length === 0
                        ? "root"
                        : helmValuesPath[helmValuesPath.length - 1],
                "description": helmValuesSchema.description,
                "children": Object.entries(helmValuesSchema.properties)
                    .map(([segment, helmValuesSchema_child]) =>
                        getRootFormFieldGroup_rec({
                            helmValues,
                            "helmValuesPath": [...helmValuesPath, segment],
                            xOnyxiaContext,
                            "helmValuesSchema": helmValuesSchema_child
                        })
                    )
                    .filter(exclude(undefined)),
                "canAdd": false,
                "canRemove": false
            });
        case "array": {
            assert(helmValuesSchema.items !== undefined);

            const values = getValueAtPathInObject<Stringifyable>({
                "obj": helmValues,
                "path": helmValuesPath
            });

            assert(values !== undefined);
            assert(values instanceof Array);

            return id<FormFieldGroup>({
                "type": "group",
                "helmValuesPathSegment": (() => {
                    assert(helmValuesPath.length !== 0);

                    return helmValuesPath[helmValuesPath.length - 1];
                })(),
                "description": helmValuesSchema.description,
                "children": [],
                "canAdd": false,
                "canRemove": false
            });
        }
        case "boolean":
            return id<FormField.Checkbox>({
                "type": "field",
                "title": getTitle(),
                isReadonly,
                "fieldType": "checkbox",
                helmValuesPath,
                "description": helmValuesSchema.description,
                "value": (() => {
                    const value = getValue();

                    assert(typeof value === "boolean");

                    return value;
                })()
            });
        case "string": {
            return undefined;
        }
        case "integer": {
            return undefined;
        }
        case "number": {
            return undefined;
        }
    }

    assert<Equals<typeof helmValuesSchema.type, never>>(false);
}
