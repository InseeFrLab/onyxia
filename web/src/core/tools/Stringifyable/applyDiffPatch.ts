import type { Stringifyable, StringifyableAtomic } from "./Stringifyable";
import { assignValueAtPath } from "./assignValueAtPath";
import { getIsAtomic } from "./getIsAtomic";
import { assert } from "tsafe/assert";

const DELETED_PLACEHOLDER = "DELETED_xLzQ6zSPxw3bmzK";

export function applyDiffPatch(params: {
    objectOrArray: Record<string, Stringifyable> | Stringifyable[];
    diffPatch: {
        path: (string | number)[];
        value: StringifyableAtomic | undefined;
    }[];
}): void {
    const { objectOrArray, diffPatch } = params;

    for (const { path, value } of diffPatch) {
        assignValueAtPath({
            stringifyableObjectOrArray: objectOrArray,
            path: path,
            value: value === undefined ? DELETED_PLACEHOLDER : value
        });
    }

    (function crawl(objectOrArray: Record<string, Stringifyable> | Stringifyable[]) {
        if (objectOrArray instanceof Array) {
            for (let i = 0; i < objectOrArray.length; i++) {
                const item: Stringifyable = objectOrArray[i];

                if (item === DELETED_PLACEHOLDER) {
                    for (let j = i + 1; j < objectOrArray.length; j++) {
                        assert(
                            objectOrArray[j] === DELETED_PLACEHOLDER,
                            "All the elements after the first deleted should be deleted"
                        );
                    }
                    objectOrArray.splice(i);
                    break;
                }

                if (getIsAtomic(item)) {
                    continue;
                }

                crawl(item);
            }
            return;
        }

        Object.entries(objectOrArray).forEach(([key, value]) => {
            if (value === DELETED_PLACEHOLDER) {
                delete objectOrArray[key];
                return;
            }

            if (getIsAtomic(value)) {
                return;
            }
            crawl(value);
        });
    })(objectOrArray);
}
