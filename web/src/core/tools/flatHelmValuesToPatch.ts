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
 * NOTE: Array values are not recoverable — the API's flattening drops them
 * (a JSON array node has no object fields to flatten). Such values simply
 * won't be pre-filled and will fall back to the chart defaults.
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
