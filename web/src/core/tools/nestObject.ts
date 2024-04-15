/**
 * Transforms a flat object with dot-separated keys into a nested object.
 *
 * @param {Record<string, any>} input - The flat object to be nested.
 * @returns {Record<string, any>} A new object with nested properties.
 *
 * @example
 * const flatObject = {
 *   "foo.bar": 1,
 *   "foo.baz": "okay",
 *   "cool": "yes"
 * };
 * const nestedObject = nestObject(flatObject);
 * // Output will be:
 * // {
 * //   "foo": {
 * //     "bar": 1,
 * //     "baz": "okay"
 * //   },
 * //   "cool": "yes"
 * // }
 */
export function nestObject(input: Record<string, any>): Record<string, any> {
    const output: Record<string, any> = {};

    for (const [key, value] of Object.entries(input)) {
        let parts = key.split(".");
        let target = output;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                target[part] = value;
            } else {
                if (!target[part] || typeof target[part] !== "object") {
                    target[part] = {};
                }
                target = target[part];
            }
        }
    }

    return output;
}
