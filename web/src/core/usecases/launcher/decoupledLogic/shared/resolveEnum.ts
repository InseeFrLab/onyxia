import {
    onyxiaReservedPropertyNameInFieldDescription,
    type XOnyxiaParams
} from "core/ports/OnyxiaApi/XOnyxia";
import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { Stringifyable } from "core/tools/Stringifyable";
import { assert } from "tsafe/assert";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import {
    resolveXOnyxiaValueReference,
    type XOnyxiaContextLike as XOnyxiaContextLike_resolveXOnyxiaValueReference
} from "./resolveXOnyxiaValueReference";
import {
    validateValueAgainstJSONSchema_noEnumCheck,
    type JSONSchemaLike as JSONSchemaLike_validateValueAgainstJSONSchema_noEnumCheck
} from "./validateValueAgainstJSONSchema/validateValueAgainstJSONSchema_noEnumCheck";

type XOnyxiaParamsLike = {
    overwriteListEnumWith?: XOnyxiaParams["overwriteListEnumWith"];
};

assert<keyof XOnyxiaParamsLike extends keyof XOnyxiaParams ? true : false>();
assert<XOnyxiaParams extends XOnyxiaParamsLike ? true : false>();

export type JSONSchemaLike = JSONSchemaLike_validateValueAgainstJSONSchema_noEnumCheck & {
    /**
     * NOTE: Here we only check if render === "list"
     * We throw if we don't have valid options and render is "list"
     * */
    render?: JSONSchema["render"];
    enum?: Stringifyable[];
    listEnum?: Stringifyable[];
    [onyxiaReservedPropertyNameInFieldDescription]?: XOnyxiaParamsLike;
};

assert<keyof JSONSchemaLike extends keyof JSONSchema ? true : false>();
assert<JSONSchema extends JSONSchemaLike ? true : false>();

export type XOnyxiaContextLike = XOnyxiaContextLike_resolveXOnyxiaValueReference;

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export function resolveEnum(params: {
    helmValuesSchema: JSONSchemaLike;
    xOnyxiaContext: XOnyxiaContextLike;
}): Stringifyable[] | undefined {
    const { helmValuesSchema, xOnyxiaContext } = params;

    x_onyxia_overwrite_list_enum_with: {
        if (helmValuesSchema["x-onyxia"]?.overwriteListEnumWith === undefined) {
            break x_onyxia_overwrite_list_enum_with;
        }

        const options_unchecked = resolveXOnyxiaValueReference({
            xOnyxiaContext,
            expression: helmValuesSchema["x-onyxia"].overwriteListEnumWith
        });

        if (options_unchecked === undefined) {
            break x_onyxia_overwrite_list_enum_with;
        }

        if (!(options_unchecked instanceof Array)) {
            break x_onyxia_overwrite_list_enum_with;
        }

        const options: Stringifyable[] = [];

        for (const option_unchecked of options_unchecked) {
            const validationResult = validateValueAgainstJSONSchema_noEnumCheck({
                helmValuesSchema,
                xOnyxiaContext,
                value: option_unchecked
            });

            if (validationResult.isValid) {
                options.push(option_unchecked);
                continue;
            } else {
                if (validationResult.reasonableApproximation === undefined) {
                    continue;
                }

                options.push(validationResult.reasonableApproximation);
            }
        }

        if (options.length === 0) {
            break x_onyxia_overwrite_list_enum_with;
        }

        return options;
    }

    listEnum_or_enum: for (const key of ["listEnum", "enum"] as const) {
        const options_unchecked = helmValuesSchema[key];

        if (options_unchecked === undefined) {
            continue;
        }

        if (!(options_unchecked instanceof Array)) {
            continue;
        }

        const options: Stringifyable[] = [];

        for (const option_unchecked of options_unchecked) {
            const validationResult = validateValueAgainstJSONSchema_noEnumCheck({
                helmValuesSchema,
                xOnyxiaContext,
                value: option_unchecked
            });

            if (!validationResult.isValid) {
                continue listEnum_or_enum;
            }

            options.push(option_unchecked);
        }

        if (options.length === 0) {
            continue listEnum_or_enum;
        }

        return options;
    }

    assert(
        helmValuesSchema.render !== "list",
        "Render as list but we have no valid options"
    );

    return undefined;
}
