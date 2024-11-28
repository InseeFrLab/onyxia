const SECOND = 1000;

export const TIME_UNITS = {
    SECOND,
    MINUTE: 60 * SECOND,
    HOUR: 60 * 60 * SECOND,
    DAY: 24 * 60 * 60 * SECOND,
    WEEK: 7 * 24 * 60 * 60 * SECOND,
    MONTH: 30 * 24 * 60 * 60 * SECOND,
    YEAR: 365 * 24 * 60 * 60 * SECOND
};

export const DURATION_DIVISOR_KEYS = [
    "second",
    "minute",
    "hour",
    "day",
    "week",
    "month",
    "year"
] as const;
