/**
 * Removes the enumerable properties whose values are
 * undefined.
 *
 * Example:
 * noUndefined({ "foo": undefined, "bar": 3 }) returns
 * a new object { "bar": 3 }
 */
export function noUndefined<T extends object>(obj: T): T {
    const out: typeof obj = {} as any;

    for (const key in obj) {
        if (obj[key] === undefined) {
            continue;
        }

        out[key] = obj[key];
    }

    return out;
}
