import { declareComponentKeys } from "i18nifty";

export const durationDivisorKeys = [
    "second",
    "minute",
    "hour",
    "day",
    "week",
    "month",
    "year"
] as const;
export type DurationDivisorKey = (typeof durationDivisorKeys)[number];

export const fromNowDivisorKeys = [...durationDivisorKeys, "now"] as const;
export type FromNowDivisorKey = (typeof fromNowDivisorKeys)[number];

const { i18n } = declareComponentKeys<
    | {
          K: "past1";
          P: { divisorKey: FromNowDivisorKey };
      }
    | {
          K: "pastN";
          P: { divisorKey: FromNowDivisorKey };
      }
    | {
          K: "future1";
          P: { divisorKey: FromNowDivisorKey };
      }
    | {
          K: "futureN";
          P: { divisorKey: FromNowDivisorKey };
      }
    | {
          K: "singular";
          P: { divisorKey: DurationDivisorKey };
      }
    | {
          K: "plural";
          P: { divisorKey: DurationDivisorKey };
      }
>()("formattedDate");
export type I18n = typeof i18n;
