import type { Stringifyable, StringifyableAtomic } from "./Stringifyable";

export function getIsAtomic(
    stringifyable: Stringifyable
): stringifyable is StringifyableAtomic {
    return (
        ["string", "number", "boolean"].includes(typeof stringifyable) ||
        stringifyable === null
    );
}
