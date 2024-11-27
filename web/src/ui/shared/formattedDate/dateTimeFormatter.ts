import { getTranslation } from "ui/i18n";
import { durationDivisorKeys, fromNowDivisorKeys } from "./type";
import { assert } from "tsafe/assert";

export const { fromNow } = (() => {
    const { getFromNowUnits } = (() => {
        type FromNowUnit = {
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

        function getFromNowUnits(): FromNowUnit[] {
            const { t } = getTranslation("formattedDate");

            return fromNowDivisorKeys.map(divisorKey => ({
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

        return { getFromNowUnits };
    })();

    function fromNow(params: { dateTime: number }): string {
        const { dateTime } = params;

        const diff = Date.now() - dateTime;
        const diffAbs = Math.abs(diff);
        for (const unit of getFromNowUnits()) {
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

export const { formatDuration } = (() => {
    const { getDurationUnits } = (() => {
        type DurationUnit = {
            max: number;
            divisor: number;
            singular: string;
            plural: string;
        };
        const SECOND = 1000;
        const MINUTE = 60 * SECOND;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;
        const WEEK = 7 * DAY;
        const MONTH = 30 * DAY;
        const YEAR = 365 * DAY;

        function getDurationUnits(): DurationUnit[] {
            const { t } = getTranslation("formattedDate");

            return durationDivisorKeys.map(divisorKey => ({
                divisor: (() => {
                    switch (divisorKey) {
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
                        default:
                            throw new Error(`Unhandled divisorKey: ${divisorKey}`);
                    }
                })(),
                max: (() => {
                    switch (divisorKey) {
                        case "second":
                            return MINUTE;
                        case "minute":
                            return HOUR;
                        case "hour":
                            return 3 * DAY;
                        case "day":
                            return WEEK + DAY;
                        case "week":
                            return MONTH;
                        case "month":
                            return YEAR;
                        case "year":
                            return Infinity;
                        default:
                            throw new Error(`Unhandled divisorKey: ${divisorKey}`);
                    }
                })(),
                singular: t("singular", { divisorKey }),
                plural: t("plural", { divisorKey })
            }));
        }

        return { getDurationUnits };
    })();

    function formatDuration(params: { durationSeconds: number }): string {
        const { durationSeconds } = params;

        for (const unit of getDurationUnits()) {
            if (durationSeconds * 1000 < unit.max) {
                const x = Math.round(durationSeconds / (unit.divisor / 1000));
                return x === 1 ? unit.singular : unit.plural.replace("#", `${x}`);
            }
        }
        assert(false);
    }

    return { formatDuration };
})();
