import type { Stringifyable } from "core/tools/Stringifyable";
import { getValueAtPath } from "core/tools/Stringifyable";
import { assert } from "tsafe/assert";

export function mutateHelmValues_removeArrayItem(params: {
    helmValues: Record<string, Stringifyable>;
    helmValuesPath: (string | number)[];
    index: number;
}): void {
    const { helmValues, helmValuesPath, index } = params;

    const arr = getValueAtPath(helmValues, helmValuesPath);

    assert(arr instanceof Array);

    arr.splice(index, 1);
}
