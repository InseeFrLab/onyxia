import type { XOnyxiaContext, JSONSchema } from "core/ports/OnyxiaApi";
import type { DeepPartial } from "core/tools/DeepPartial";
import { type Stringifyable, getValueAtPath } from "core/tools/Stringifyable";
import { assert, is, type Equals } from "tsafe/assert";
import { computeHelmValues } from "./computeHelmValues";
import { same } from "evt/tools/inDepth/same";

export function computeAutocompleteOptions(params: {
    helmValuesPath: (string | number)[];
    helmValues: Record<string, Stringifyable>;
    helmValuesSchema: JSONSchema;
    xOnyxiaContext: XOnyxiaContext;
    xOnyxiaContext_autoCompleteOptions: DeepPartial<XOnyxiaContext>;
}): {
    optionValue: string;
    overwrite: {
        helmValuePath: (string | number)[];
        helmValues_subtree: Stringifyable;
    };
}[] {
    const {
        helmValuesPath,
        helmValues,
        helmValuesSchema,
        xOnyxiaContext,
        xOnyxiaContext_autoCompleteOptions
    } = params;

    if (helmValuesPath.length < 3) {
        return [];
    }

    if (
        !(
            typeof helmValuesPath[helmValuesPath.length - 1] === "string" &&
            typeof helmValuesPath[helmValuesPath.length - 2] === "number"
        )
    ) {
        return [];
    }

    const helmValuesPath_array = helmValuesPath.slice(0, -2);

    const helmValuesSchema_array = getSchemaAtPath({
        schema: helmValuesSchema,
        path: helmValuesPath_array
    });

    if (helmValuesSchema_array === undefined) {
        return [];
    }

    if (helmValuesSchema_array.type !== "array") {
        return [];
    }

    const { items } = helmValuesSchema_array;

    if (items === undefined) {
        return [];
    }

    if (items.type !== "object") {
        return [];
    }

    const { overwriteDefaultWith } = helmValuesSchema_array["x-onyxia"] ?? {};

    if (typeof overwriteDefaultWith !== "string") {
        return [];
    }

    const path_xOnyxiaContext = overwriteDefaultWith
        .replace(/^\{\{/, "")
        .replace(/\}\}$/, "")
        .split(".");

    assert(is<Record<string, Stringifyable>>(xOnyxiaContext_autoCompleteOptions));

    const optionArray_xOnyxiaContext = getValueAtPath({
        stringifyableObjectOrArray: xOnyxiaContext_autoCompleteOptions,
        path: path_xOnyxiaContext,
        doDeleteFromSource: false,
        doFailOnUnresolved: false
    });

    if (!(optionArray_xOnyxiaContext instanceof Array)) {
        return [];
    }

    const autocompleteOptions: {
        optionValue: string;
        overwrite: {
            helmValuePath: (string | number)[];
            helmValues_subtree: Stringifyable;
        };
    }[] = [];

    const helmValues_currentArray = getValueAtPath({
        stringifyableObjectOrArray: helmValues,
        doDeleteFromSource: false,
        doFailOnUnresolved: true,
        path: helmValuesPath_array
    });

    assert(helmValues_currentArray instanceof Array);

    for (const option_xOnyxiaContext of optionArray_xOnyxiaContext) {
        if (
            !(option_xOnyxiaContext instanceof Object) ||
            option_xOnyxiaContext instanceof Array
        ) {
            continue;
        }

        const { helmValues: helmValues_subtree } = computeHelmValues({
            helmValuesSchema: items,
            helmValuesYaml: "{}",
            xOnyxiaContext: { ...xOnyxiaContext, ...option_xOnyxiaContext },
            infoAmountInHelmValues: "user provided"
        });

        const lastSegment = helmValuesPath[helmValuesPath.length - 1];

        const optionValue = helmValues_subtree[lastSegment];

        if (typeof optionValue !== "string") {
            continue;
        }

        if (
            helmValues_currentArray.find(entry => same(entry, helmValues_subtree)) !==
            undefined
        ) {
            continue;
        }

        if (
            autocompleteOptions.find(
                autocompleteOption => autocompleteOption.optionValue === optionValue
            ) !== undefined
        ) {
            continue;
        }

        autocompleteOptions.push({
            optionValue,
            overwrite: {
                helmValuePath: helmValuesPath.slice(0, -1),
                helmValues_subtree: helmValues_subtree
            }
        });
    }

    return autocompleteOptions;
}

function getSchemaAtPath(params: {
    schema: JSONSchema;
    path: (string | number)[];
}): JSONSchema | undefined {
    const { schema, path } = params;

    if (path.length === 0) {
        return schema;
    }

    const [firstSegment, ...rest] = path;

    switch (typeof firstSegment) {
        case "string": {
            if (!(schema.type === "object" && schema.properties !== undefined)) {
                return undefined;
            }

            const schema_next = schema.properties[firstSegment];

            if (schema_next === undefined) {
                return undefined;
            }

            return getSchemaAtPath({
                schema: schema_next,
                path: rest
            });
        }
        case "number": {
            if (!(schema.type === "array" && schema.items !== undefined)) {
                return undefined;
            }

            const schema_next = schema.items;

            return getSchemaAtPath({
                schema: schema_next,
                path: rest
            });
        }
        default:
            assert<Equals<typeof firstSegment, never>>(false);
    }
}
