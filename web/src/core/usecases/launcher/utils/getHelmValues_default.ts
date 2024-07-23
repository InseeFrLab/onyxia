import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import type { StringifyableObject } from "core/tools/Stringifyable";

export function getHelmValues_default(params: {
    helmValuesSchema: JSONSchema;
    xOnyxiaContext: XOnyxiaContext;
}): { helmValues_default: StringifyableObject; isChartUsingS3: boolean } {
    return null as any;
}
