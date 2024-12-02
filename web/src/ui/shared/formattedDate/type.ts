import { declareComponentKeys } from "i18nifty";
import { DURATION_DIVISOR_KEYS } from "core/tools/timeFormat/constants";
import type { DurationDivisorKey } from "core/tools/timeFormat/type";

export const fromNowDivisorKeys = [...DURATION_DIVISOR_KEYS, "now"] as const;
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
