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
} from "../resolveXOnyxiaValueReference";

type XOnyxiaParamsLike = {
    overwriteListEnumWith?: string;
};

assert<keyof XOnyxiaParamsLike extends keyof XOnyxiaParams ? true : false>();
assert<XOnyxiaParams extends XOnyxiaParamsLike ? true : false>();

export type JSONSchemaLike = {
    type: "array" | "string" | "boolean" | "integer" | "number";
    items?: JSONSchemaLike;
    minItems?: number;
    maxItems?: number;
    minimum?: number;
    pattern?: string;
    render?: "textArea" | "password" | "list" | "slider";
    enum?: Stringifyable[];
    listEnum?: Stringifyable[];
    sliderMax?: number;
    sliderMin?: number;
    sliderUnit?: string;
    properties?: Record<string, JSONSchemaLike>;
    [onyxiaReservedPropertyNameInFieldDescription]?: XOnyxiaParamsLike;
};

assert<keyof JSONSchemaLike extends keyof JSONSchema ? true : false>();
assert<JSONSchema extends JSONSchemaLike ? true : false>();

export type XOnyxiaContextLike = XOnyxiaContextLike_resolveXOnyxiaValueReference;

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export function resolveEnum(params: {
    helmValuesSchema: JSONSchemaLike;
    xOnyxiaContext: XOnyxiaContextLike;
}): Stringifyable[] | undefined {}
