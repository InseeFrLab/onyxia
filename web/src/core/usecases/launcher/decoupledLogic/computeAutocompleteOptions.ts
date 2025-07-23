import type { XOnyxiaContext, JSONSchema } from "core/ports/OnyxiaApi";
import type { DeepPartial } from "core/tools/DeepPartial";
import type { Stringifyable } from "core/tools/Stringifyable";

export function computeAutocompleteOptions(params: {
    xOnyxiaContext: XOnyxiaContext;
    xOnyxiaContext_autoCompleteOptions: DeepPartial<XOnyxiaContext>;
    helmValuesSchema: JSONSchema;
    helmValues: Record<string, Stringifyable>;
    helmValuesPath: (string | number)[];
}): {
    optionValue: string;
    overwrite: {
        helmValuePath: (string | number)[];
        helmValues_subtree: Stringifyable;
    };
}[] {
    return null as any;
}
