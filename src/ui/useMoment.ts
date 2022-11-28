import { useMemo, useEffect, useReducer } from "react";
import moment from "moment";
import "moment/locale/fr";
import { useLang } from "./i18n";
import { assert } from "tsafe/assert";
import type { Language } from "./i18n";

export const { getFormattedDate } = (() => {
    const getFormatByLng = (isSameYear: boolean) => ({
        /* spell-checker: disable */
        "fr": `dddd Do MMMM${isSameYear ? "" : " YYYY"} à H[h]mm`,
        "en": `dddd, MMMM Do${isSameYear ? "" : " YYYY"}, h:mm a`,
        "zh-CN": `dddd, MMMM Do${isSameYear ? "" : " YYYY"}, h:mm a`
        /* spell-checker: enable */
    });

    function getFormattedDate(params: { time: number; lang: Language }): string {
        const { time, lang } = params;

        const date = new Date(time);

        const isSameYear = date.getFullYear() === new Date().getFullYear();

        return moment(date).locale(lang).format(getFormatByLng(isSameYear)[lang]);
    }

    return { getFormattedDate };
})();

export function useFormattedDate(params: { time: number }): string {
    const { time } = params;

    const { lang } = useLang();

    return useMemo(() => getFormattedDate({ time, lang }), [time, lang]);
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
        const SECOND = 1000;
        const MINUTE = 60 * SECOND;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;
        const WEEK = 7 * DAY;
        const MONTH = 30 * DAY;
        const YEAR = 365 * DAY;

        type Unit = {
            max: number;
            divisor: number;
            past1: string;
            pastN: string;
            future1: string;
            futureN: string;
        };

        function getUnits(params: { lang: Language }): Unit[] {
            const { lang } = params;

            return [
                {
                    "max": 4 * SECOND,
                    "divisor": 1,
                    ...(() => {
                        const text = (() => {
                            switch (lang) {
                                case "en":
                                    return "just now";
                                case "fr":
                                    /* cspell: disable-next-line */
                                    return "il y a quelques instants";
                                case "zh-CN":
                                    /* cspell: disable-next-line */
                                    return "几分钟前";
                            }
                        })();

                        return {
                            "past1": text,
                            "pastN": text,
                            "future1": text,
                            "futureN": text
                        };
                    })()
                },
                {
                    "max": MINUTE,
                    "divisor": SECOND,
                    ...(() => {
                        switch (lang) {
                            case "en":
                                return {
                                    "past1": "a second ago",
                                    "pastN": "# seconds ago",
                                    "future1": "in a second",
                                    "futureN": "in # seconds"
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "il y a une seconde",
                                    "pastN": "il y a # secondes",
                                    "future1": "dans une seconde",
                                    "futureN": "dans # secondes"
                                } as const;

                            case "zh-CN":
                                return {
                                    "past1": "在一秒钟前",
                                    "pastN": "在 # 秒前",
                                    "future1": "在一秒钟后",
                                    "futureN": "在 # 秒后"
                                } as const;
                            /* spell-checker: enable */
                        }
                    })()
                },
                {
                    "max": HOUR,
                    "divisor": MINUTE,
                    ...(() => {
                        switch (lang) {
                            case "en":
                                return {
                                    "past1": "a minute ago",
                                    "pastN": "# minutes ago",
                                    "future1": "in a minute",
                                    "futureN": "in # minutes"
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "il y a une minute",
                                    "pastN": "il y a # minutes",
                                    "future1": "dans une minute",
                                    "futureN": "dans # minutes"
                                } as const;
                            case "zh-CN":
                                return {
                                    "past1": "在一分钟前",
                                    "pastN": "在 # 分钟前",
                                    "future1": "在几分钟后",
                                    "futureN": "在 # 分钟后"
                                } as const;
                            /* spell-checker: enable */
                        }
                    })()
                },
                {
                    "max": DAY,
                    "divisor": HOUR,
                    ...(() => {
                        switch (lang) {
                            case "en":
                                return {
                                    "past1": "an hour ago",
                                    "pastN": "# hours ago",
                                    "future1": "in an hour",
                                    "futureN": "in # hours"
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "il y a une heure",
                                    "pastN": "il y a # heures",
                                    "future1": "dans une heure",
                                    "futureN": "dans # heures"
                                } as const;
                            case "zh-CN":
                                return {
                                    "past1": "在一小时前",
                                    "pastN": "在 # 小时前",
                                    "future1": "在一小时后",
                                    "futureN": "在 # 小时后"
                                } as const;
                            /* spell-checker: enable */
                        }
                    })()
                },
                {
                    "max": WEEK,
                    "divisor": DAY,
                    ...(() => {
                        switch (lang) {
                            case "en":
                                return {
                                    "past1": "yesterday",
                                    "pastN": "# days ago",
                                    "future1": "tomorrow",
                                    "futureN": "in # days"
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "hier",
                                    "pastN": "il y a # jours",
                                    "future1": "demain",
                                    "futureN": "dans # jours"
                                } as const;
                            case "zh-CN":
                                return {
                                    "past1": "昨天",
                                    "pastN": "在 # 天前",
                                    "future1": "明天",
                                    "futureN": "在 # 天后"
                                } as const;
                            /* spell-checker: enable */
                        }
                    })()
                },
                {
                    "max": 4 * WEEK,
                    "divisor": WEEK,
                    ...(() => {
                        switch (lang) {
                            case "en":
                                return {
                                    "past1": "last week",
                                    "pastN": "# weeks ago",
                                    "future1": "in a week",
                                    "futureN": "in # weeks"
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "la semaine dernière",
                                    "pastN": "il y a # semaines",
                                    "future1": "dans une semaine",
                                    "futureN": "dans # semaines"
                                } as const;
                            case "zh-CN":
                                return {
                                    "past1": "在一星期前",
                                    "pastN": "在 # 星期前",
                                    "future1": "在一星期后",
                                    "futureN": "在 # 星期后"
                                } as const;
                            /* spell-checker: enable */
                        }
                    })()
                },
                {
                    "max": YEAR,
                    "divisor": MONTH,
                    ...(() => {
                        switch (lang) {
                            case "en":
                                return {
                                    "past1": "last month",
                                    "pastN": "# months ago",
                                    "future1": "in a month",
                                    "futureN": "in # months"
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "le mois dernier",
                                    "pastN": "il y a # mois",
                                    "future1": "dans un mois",
                                    "futureN": "dans # mois"
                                } as const;
                            case "zh-CN":
                                return {
                                    "past1": "在一个月前",
                                    "pastN": "在 # 个月前",
                                    "future1": "在一个月后",
                                    "futureN": "在 # 个月后"
                                } as const;
                            /* spell-checker: enable */
                        }
                    })()
                },
                {
                    "max": 100 * YEAR,
                    "divisor": YEAR,
                    ...(() => {
                        switch (lang) {
                            case "en":
                                return {
                                    "past1": "last year",
                                    "pastN": "# years ago",
                                    "future1": "in a year",
                                    "futureN": "in # years"
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "l'année dernière",
                                    "pastN": "il y a # ans",
                                    "future1": "dans un ans",
                                    "futureN": "dans # ans"
                                } as const;
                            case "zh-CN":
                                return {
                                    "past1": "在去年",
                                    "pastN": "在 # 年前",
                                    "future1": "在明年",
                                    "futureN": "在 # 年后"
                                } as const;
                            /* spell-checker: enable */
                        }
                    })()
                },
                {
                    "max": 1000 * YEAR,
                    "divisor": 100 * YEAR,
                    ...(() => {
                        switch (lang) {
                            case "en":
                                return {
                                    "past1": "last century",
                                    "pastN": "# centuries ago",
                                    "future1": "in a century",
                                    "futureN": "in # centuries"
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "le siècle dernier",
                                    "pastN": "il y a # siècle",
                                    "future1": "dans un siècle",
                                    "futureN": "dans # siècle"
                                } as const;
                            case "zh-CN":
                                return {
                                    "past1": "在上个世纪",
                                    "pastN": "在 # 个世纪前",
                                    "future1": "在下个世纪",
                                    "futureN": "在 # 个世纪后"
                                } as const;
                            /* spell-checker: enable */
                        }
                    })()
                },
                {
                    "max": Infinity,
                    "divisor": 1000 * YEAR,
                    ...(() => {
                        switch (lang) {
                            case "en":
                                return {
                                    "past1": "last millennium",
                                    "pastN": "# millennia ago",
                                    "future1": "in a millennium",
                                    "futureN": "in # millennia"
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "au cour du millénaire",
                                    "pastN": "Il y a # millénaires",
                                    "future1": "dans un millénaire",
                                    "futureN": "dans # millétaire"
                                } as const;
                            case "zh-CN":
                                return {
                                    "past1": "在一千年前",
                                    "pastN": "在 # 千年前",
                                    "future1": "在一千年后",
                                    "futureN": "在 # 千年后"
                                } as const;
                            /* spell-checker: enable */
                        }
                    })()
                }
            ];
        }

        return { getUnits };
    })();

    function fromNow(params: { dateTime: number; lang: Language }): string {
        const { dateTime, lang } = params;

        const diff = Date.now() - dateTime;
        const diffAbs = Math.abs(diff);
        for (const unit of getUnits({ lang })) {
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
        () => fromNow({ dateTime, lang }),

        [lang, trigger, dateTime]
    );

    return { fromNowText };
}
