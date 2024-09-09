import type { Stringifyable } from "core/tools/Stringifyable";
import type { JSONSchema } from "core/ports/OnyxiaApi";
import type { FormFieldValue } from "../formTypes";

export function mutateHelmValues_update(params: {
    helmValues: Record<string, Stringifyable>;
    helmValuesSchema: JSONSchema;
    formFieldValue: FormFieldValue;
}): void {
    const { helmValues, helmValuesSchema, formFieldValue } = params;
}
