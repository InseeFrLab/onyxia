import { assert } from "tsafe/assert";
import { DurationTranslationFunction } from "./type";
import { TIME_UNITS, DURATION_DIVISOR_KEYS } from "./constants";

export const { formatDuration } = (() => {
    const { getDurationUnits } = (() => {
        type DurationUnit = {
            max: number;
            divisor: number;
            singular: string;
            plural: string;
        };

        function getDurationUnits(t: DurationTranslationFunction): DurationUnit[] {
            return DURATION_DIVISOR_KEYS.map(divisorKey => ({
                divisor: (() => {
                    switch (divisorKey) {
                        case "second":
                            return TIME_UNITS.SECOND;
                        case "minute":
                            return TIME_UNITS.MINUTE;
                        case "hour":
                            return TIME_UNITS.HOUR;
                        case "day":
                            return TIME_UNITS.DAY;
                        case "week":
                            return TIME_UNITS.WEEK;
                        case "month":
                            return TIME_UNITS.MONTH;
                        case "year":
                            return TIME_UNITS.YEAR;
                    }
                })(),
                max: (() => {
                    switch (divisorKey) {
                        case "second":
                            return TIME_UNITS.MINUTE;
                        case "minute":
                            return TIME_UNITS.HOUR;
                        case "hour":
                            return 3 * TIME_UNITS.DAY;
                        case "day":
                            return TIME_UNITS.WEEK + TIME_UNITS.DAY;
                        case "week":
                            return TIME_UNITS.MONTH;
                        case "month":
                            return TIME_UNITS.YEAR;
                        case "year":
                            return Infinity;
                    }
                })(),
                singular: t("singular", { divisorKey }),
                plural: t("plural", { divisorKey })
            }));
        }

        return { getDurationUnits };
    })();

    function formatDuration(params: {
        durationSeconds: number;
        t: DurationTranslationFunction;
    }): string {
        const { durationSeconds, t } = params;

        for (const unit of getDurationUnits(t)) {
            if (durationSeconds * 1000 < unit.max) {
                const x = Math.round(durationSeconds / (unit.divisor / 1000));
                return x === 1 ? unit.singular : unit.plural.replace("#", `${x}`);
            }
        }
        assert(false);
    }

    return { formatDuration };
})();

export const englishDurationFormatter: DurationTranslationFunction = (key, params) => {
    const en = {
        singular: {
            second: "1 second",
            minute: "1 minute",
            hour: "1 hour",
            day: "1 day",
            week: "1 week",
            month: "1 month",
            year: "1 year"
        },
        plural: {
            second: "# seconds",
            minute: "# minutes",
            hour: "# hours",
            day: "# days",
            week: "# weeks",
            month: "# months",
            year: "# years"
        }
    };
    return en[key][params.divisorKey];
};
