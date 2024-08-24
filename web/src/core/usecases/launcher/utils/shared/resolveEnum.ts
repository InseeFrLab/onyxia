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

type XOnyxiaParamsLike = {
    overwriteListEnumWith?: string;
};

assert<keyof XOnyxiaParamsLike extends keyof XOnyxiaParams ? true : false>();
assert<XOnyxiaParams extends XOnyxiaParamsLike ? true : false>();

export type JSONSchemaLike = {
    type: "string" | "number" | "boolean" | "object" | "array" | "integer";
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

    if (helmValuesSchema.type !== "array") {
        return undefined;
    }

    x_onyxia_overwrite_list_enum_with: {
        if (helmValuesSchema["x-onyxia"]?.overwriteListEnumWith === undefined) {
            break x_onyxia_overwrite_list_enum_with;
        }

        const options = resolveXOnyxiaValueReference({
            xOnyxiaContext,
            "expression": helmValuesSchema["x-onyxia"].overwriteListEnumWith
        });

        if (options === undefined) {
            break x_onyxia_overwrite_list_enum_with;
        }

        if (!(options instanceof Array)) {
            break x_onyxia_overwrite_list_enum_with;
        }

        return options;
    }

    list_enum: {
        if (helmValuesSchema.listEnum === undefined) {
            break list_enum;
        }

        return helmValuesSchema.listEnum;
    }

    enum_: {
        if (helmValuesSchema.enum === undefined) {
            break enum_;
        }

        return helmValuesSchema.enum;
    }

    assert(helmValuesSchema.render !== "list");

    return undefined;
}
