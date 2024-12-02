import { getTranslation } from "ui/i18n";
import { fromNowDivisorKeys } from "./type";
import { formatDuration as coreFormatDuration } from "core/tools/timeFormat/formatDuration";
import { TIME_UNITS } from "core/tools/timeFormat/constants";
import { assert } from "tsafe/assert";

type FromNowUnit = {
    max: number;
    divisor: number;
    past1: string;
    pastN: string;
    future1: string;
    futureN: string;
};

function getFromNowUnits(): FromNowUnit[] {
    const { t } = getTranslation("formattedDate");

    return fromNowDivisorKeys.map(divisorKey => ({
        divisor: (() => {
            switch (divisorKey) {
                case "now":
                    return 1;
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
                case "now":
                    return 4 * TIME_UNITS.SECOND;
                case "second":
                    return TIME_UNITS.MINUTE;
                case "minute":
                    return TIME_UNITS.HOUR;
                case "hour":
                    return TIME_UNITS.DAY;
                case "day":
                    return TIME_UNITS.WEEK;
                case "week":
                    return TIME_UNITS.MONTH;
                case "month":
                    return TIME_UNITS.YEAR;
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

export function fromNow(params: { dateTime: number }): string {
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

export function formatDuration(params: { durationSeconds: number }) {
    const { t } = getTranslation("formattedDate");
    const { durationSeconds } = params;
    return coreFormatDuration({ durationSeconds, t });
}
