import { DURATION_DIVISOR_KEYS } from "./constants";

export type DurationDivisorKey = (typeof DURATION_DIVISOR_KEYS)[number];

export type DurationTranslationFunction = (
    key: "singular" | "plural",
    params: { divisorKey: DurationDivisorKey }
) => string;
