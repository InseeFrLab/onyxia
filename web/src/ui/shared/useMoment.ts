import { useMemo, useEffect, useReducer } from "react";
import moment from "moment";
import { useLang, getTranslation, evtLang } from "ui/i18n";
import { assert } from "tsafe/assert";
import { declareComponentKeys } from "i18nifty";

export function getFormattedDate(params: { time: number }): string {
    const { time } = params;

    const date = new Date(time);

    const isSameYear = date.getFullYear() === new Date().getFullYear();

    const lang = evtLang.state;
    const { t } = getTranslation("moment");

    return moment(date).locale(lang).format(t("date format", { isSameYear }));
}

export function useFormattedDate(params: { time: number }): string {
    const { time } = params;

    // NOTE: So that we get a refresh when the lang is changed.
    const { lang } = useLang();

    return useMemo(() => getFormattedDate({ time }), [time, lang]);
}

export function useValidUntil(params: { millisecondsLeft: number }): string {
    const { millisecondsLeft } = params;

    const { lang } = useLang();

    const validUntil = useMemo(
        () =>
            moment()
                .locale(lang)
                .add(millisecondsLeft, "milliseconds")
                .calendar()
                .toLowerCase(),
        [lang, millisecondsLeft]
    );

    return validUntil;
}

export const { fromNow } = (() => {
    const { getUnits } = (() => {
        type Unit = {
            max: number;
            divisor: number;
            past1: string;
            pastN: string;
            future1: string;
            futureN: string;
        };

        const SECOND = 1000;
        const MINUTE = 60 * SECOND;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;
        const WEEK = 7 * DAY;
        const MONTH = 30 * DAY;
        const YEAR = 365 * DAY;

        function getUnits(): Unit[] {
            const { t } = getTranslation("moment");

            return divisorKeys.map(divisorKey => ({
                divisor: (() => {
                    switch (divisorKey) {
                        case "now":
                            return 1;
                        case "second":
                            return SECOND;
                        case "minute":
                            return MINUTE;
                        case "hour":
                            return HOUR;
                        case "day":
                            return DAY;
                        case "week":
                            return WEEK;
                        case "month":
                            return MONTH;
                        case "year":
                            return YEAR;
                    }
                })(),
                max: (() => {
                    switch (divisorKey) {
                        case "now":
                            return 4 * SECOND;
                        case "second":
                            return MINUTE;
                        case "minute":
                            return HOUR;
                        case "hour":
                            return DAY;
                        case "day":
                            return WEEK;
                        case "week":
                            return MONTH;
                        case "month":
                            return YEAR;
                        case "year":
                            return Infinity;
                    }
                })(),
                past1: t("past1", { divisorKey }),
                pastN: t("pastN", { divisorKey }),
                future1: t("future1", { divisorKey }),
                futureN: t("futureN", { divisorKey })
            }));
        }

        return { getUnits };
    })();

    function fromNow(params: { dateTime: number }): string {
        const { dateTime } = params;

        const diff = Date.now() - dateTime;
        const diffAbs = Math.abs(diff);
        for (const unit of getUnits()) {
            if (diffAbs < unit.max) {
                const isFuture = diff < 0;
                const x = Math.round(Math.abs(diff) / unit.divisor);
                if (x <= 1) return isFuture ? unit.future1 : unit.past1;
                return (isFuture ? unit.futureN : unit.pastN).replace("#", `${x}`);
            }
        }
        assert(false);
    }

    return { fromNow };
})();

export function useFromNow(params: { dateTime: number }) {
    const { dateTime } = params;

    const [trigger, forceUpdate] = useReducer(n => n + 1, 0);

    useEffect(() => {
        const timer = setInterval(() => forceUpdate(), 1000);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    const { lang } = useLang();

    const fromNowText = useMemo(
        () => fromNow({ dateTime }),

        [lang, trigger, dateTime]
    );

    return { fromNowText };
}

const divisorKeys = [
    "now",
    "second",
    "minute",
    "hour",
    "day",
    "week",
    "month",
    "year"
] as const;
type DivisorKey = (typeof divisorKeys)[number];

const { i18n } = declareComponentKeys<
    | {
          K: "date format";
          P: { isSameYear: boolean };
      }
    | {
          K: "past1";
          P: { divisorKey: DivisorKey };
      }
    | {
          K: "pastN";
          P: { divisorKey: DivisorKey };
      }
    | {
          K: "future1";
          P: { divisorKey: DivisorKey };
      }
    | {
          K: "futureN";
          P: { divisorKey: DivisorKey };
      }
>()("moment");
export type I18n = typeof i18n;
