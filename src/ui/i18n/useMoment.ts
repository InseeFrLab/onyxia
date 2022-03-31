import { useMemo, useEffect, useReducer } from "react";
import moment from "moment";
import "moment/locale/fr";
import { useLng } from "./useLng";
import { assert } from "tsafe/assert";
import type { Language } from "./useLng";

export const { getFormattedDate } = (() => {
    const getFormatByLng = (isSameYear: boolean) => ({
        /* spell-checker: disable */
        "fr": `dddd Do MMMM${isSameYear ? "" : " YYYY"} à H[h]mm`,
        "en": `dddd, MMMM Do${isSameYear ? "" : " YYYY"}, h:mm a`,
        /* spell-checker: enable */
    });

    function getFormattedDate(params: { time: number; lng: Language }): string {
        const { time, lng } = params;

        const date = new Date(time);

        const isSameYear = date.getFullYear() === new Date().getFullYear();

        return moment(date).locale(lng).format(getFormatByLng(isSameYear)[lng]);
    }

    return { getFormattedDate };
})();

export function useFormattedDate(params: { time: number }): string {
    const { time } = params;

    const { lng } = useLng();

    return useMemo(() => getFormattedDate({ time, lng }), [time, lng]);
}

export function useValidUntil(params: { millisecondsLeft: number }): string {
    const { millisecondsLeft } = params;

    const { lng } = useLng();

    const validUntil = useMemo(
        () =>
            moment()
                .locale(lng)
                .add(millisecondsLeft, "milliseconds")
                .calendar()
                .toLowerCase(),

        [lng, millisecondsLeft],
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

        function getUnits(params: { lng: Language }): Unit[] {
            const { lng } = params;

            return [
                {
                    "max": 4 * SECOND,
                    "divisor": 1,
                    ...(() => {
                        const text = (() => {
                            switch (lng) {
                                case "en":
                                    return "just now";
                                case "fr":
                                    /* cspell: disable-next-line */
                                    return "il y a quelques instants";
                            }
                        })();

                        return {
                            "past1": text,
                            "pastN": text,
                            "future1": text,
                            "futureN": text,
                        };
                    })(),
                },
                {
                    "max": MINUTE,
                    "divisor": SECOND,
                    ...(() => {
                        switch (lng) {
                            case "en":
                                return {
                                    "past1": "a second ago",
                                    "pastN": "# seconds ago",
                                    "future1": "in a second",
                                    "futureN": "in # seconds",
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "il y a une seconde",
                                    "pastN": "il y a # secondes",
                                    "future1": "dans une seconde",
                                    "futureN": "dans # secondes",
                                } as const;
                            /* spell-checker: enable */
                        }
                    })(),
                },
                {
                    "max": HOUR,
                    "divisor": MINUTE,
                    ...(() => {
                        switch (lng) {
                            case "en":
                                return {
                                    "past1": "a minute ago",
                                    "pastN": "# minutes ago",
                                    "future1": "in a minute",
                                    "futureN": "in # minutes",
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "il y a une minute",
                                    "pastN": "il y a # minutes",
                                    "future1": "dans une minute",
                                    "futureN": "dans # minutes",
                                } as const;
                            /* spell-checker: enable */
                        }
                    })(),
                },
                {
                    "max": DAY,
                    "divisor": HOUR,
                    ...(() => {
                        switch (lng) {
                            case "en":
                                return {
                                    "past1": "an hour ago",
                                    "pastN": "# hours ago",
                                    "future1": "in an hour",
                                    "futureN": "in # hours",
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "il y a une heure",
                                    "pastN": "il y a # heures",
                                    "future1": "dans une heure",
                                    "futureN": "dans # heures",
                                } as const;
                            /* spell-checker: enable */
                        }
                    })(),
                },
                {
                    "max": WEEK,
                    "divisor": DAY,
                    ...(() => {
                        switch (lng) {
                            case "en":
                                return {
                                    "past1": "yesterday",
                                    "pastN": "# days ago",
                                    "future1": "tomorrow",
                                    "futureN": "in # days",
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "hier",
                                    "pastN": "il y a # jours",
                                    "future1": "demain",
                                    "futureN": "dans # jours",
                                } as const;
                            /* spell-checker: enable */
                        }
                    })(),
                },
                {
                    "max": 4 * WEEK,
                    "divisor": WEEK,
                    ...(() => {
                        switch (lng) {
                            case "en":
                                return {
                                    "past1": "last week",
                                    "pastN": "# weeks ago",
                                    "future1": "in a week",
                                    "futureN": "in # weeks",
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "la semaine dernière",
                                    "pastN": "il y a # semaines",
                                    "future1": "dans une semaine",
                                    "futureN": "dans # semaines",
                                } as const;
                            /* spell-checker: enable */
                        }
                    })(),
                },
                {
                    "max": YEAR,
                    "divisor": MONTH,
                    ...(() => {
                        switch (lng) {
                            case "en":
                                return {
                                    "past1": "last month",
                                    "pastN": "# months ago",
                                    "future1": "in a month",
                                    "futureN": "in # months",
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "le mois dernier",
                                    "pastN": "il y a # mois",
                                    "future1": "dans un mois",
                                    "futureN": "dans # mois",
                                } as const;
                            /* spell-checker: enable */
                        }
                    })(),
                },
                {
                    "max": 100 * YEAR,
                    "divisor": YEAR,
                    ...(() => {
                        switch (lng) {
                            case "en":
                                return {
                                    "past1": "last year",
                                    "pastN": "# years ago",
                                    "future1": "in a year",
                                    "futureN": "in # years",
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "l'année dernière",
                                    "pastN": "il y a # ans",
                                    "future1": "dans un ans",
                                    "futureN": "dans # ans",
                                } as const;
                            /* spell-checker: enable */
                        }
                    })(),
                },
                {
                    "max": 1000 * YEAR,
                    "divisor": 100 * YEAR,
                    ...(() => {
                        switch (lng) {
                            case "en":
                                return {
                                    "past1": "last century",
                                    "pastN": "# centuries ago",
                                    "future1": "in a century",
                                    "futureN": "in # centuries",
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "le siècle dernier",
                                    "pastN": "il y a # siècle",
                                    "future1": "dans un siècle",
                                    "futureN": "dans # siècle",
                                } as const;
                            /* spell-checker: enable */
                        }
                    })(),
                },
                {
                    "max": Infinity,
                    "divisor": 1000 * YEAR,
                    ...(() => {
                        switch (lng) {
                            case "en":
                                return {
                                    "past1": "last millennium",
                                    "pastN": "# millennia ago",
                                    "future1": "in a millennium",
                                    "futureN": "in # millennia",
                                } as const;
                            /* spell-checker: disable */
                            case "fr":
                                return {
                                    "past1": "au cour du millénaire",
                                    "pastN": "Il y a # millénaires",
                                    "future1": "dans un millénaire",
                                    "futureN": "dans # millétaire",
                                } as const;
                            /* spell-checker: enable */
                        }
                    })(),
                },
            ];
        }

        return { getUnits };
    })();

    function fromNow(params: { dateTime: number; lng: Language }): string {
        const { dateTime, lng } = params;

        const diff = Date.now() - dateTime;
        const diffAbs = Math.abs(diff);
        for (const unit of getUnits({ lng })) {
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

    const { lng } = useLng();

    const fromNowText = useMemo(
        () => fromNow({ dateTime, lng }),

        [lng, trigger, dateTime],
    );

    return { fromNowText };
}
