import type { Stringifyable } from "core/tools/Stringifyable";
import type { JSONSchema } from "core/ports/OnyxiaApi";
import type { FormFieldValue } from "../formTypes";

export function updateHelmValues(params: {
    helmValues: Record<string, Stringifyable>;
    helmValuesSchema: JSONSchema;
    action:
        | {
              name: "update value";
              formFieldValue: FormFieldValue;
          }
        | {
              name: "add array item";
              helmValuesPath: (string | number)[];
          }
        | {
              name: "remove array item";
              helmValuesPath: (string | number)[];
              index: number;
          };
}): void {}
