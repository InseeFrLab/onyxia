import type { StringifyableAtomic } from "./Stringifyable";

/**
 * Converts the flat, dot-separated helm values returned by the Onyxia API
 * (where every value is a string) into a `helmValuesPatch` that can be
 * applied on top of the launcher's default values.
 *
 * The API flattens the user-supplied values of a release into dot-separated
 * keys and stringifies every value (see `mapAppender` in `HelmAppsService`).
 * Values stay strings: the original type is only known from the chart's schema,
 * so the launcher coerces them (see `coerceHelmValuesPatch`).
 *
 * NOTE: Array items are flattened with their index (`network.0.name`). The index
 * stays a string here, `coerceHelmValuesPatch` turns it into a number when the
 * schema says the parent is an array.
 */
export function flatHelmValuesToPatch(flatHelmValues: Record<string, string>): {
    path: (string | number)[];
    value: StringifyableAtomic | undefined;
}[] {
    return Object.entries(flatHelmValues).map(([key, value]) => ({
        path: key.split("."),
        value
    }));
}
