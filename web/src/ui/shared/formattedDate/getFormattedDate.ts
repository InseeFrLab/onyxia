export function getFormattedDate(params: { time: number; lang: string }): string {
    const { time, lang } = params;

    const date = new Date(time);

    const isSameYear = date.getFullYear() === new Date().getFullYear();

    const formattedDate = new Intl.DateTimeFormat(lang, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: isSameYear ? undefined : "numeric",
        hour: "numeric",
        minute: "numeric"
    }).format(date);

    return formattedDate;
}

export function getFormattedRelativeDate(params: {
    time: number;
    lang: string;
    now?: number;
}): string {
    const { time, lang, now = Date.now() } = params;

    const date = new Date(time);
    const dayOffset = getLocalDayOffset({
        date,
        referenceDate: new Date(now)
    });

    if (dayOffset < -1 || dayOffset > 1) {
        return getFormattedDate({ time, lang });
    }

    const relativeDay = capitalizeFirstLetter({
        text: new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(
            dayOffset,
            "day"
        ),
        lang
    });

    return `${relativeDay}${getFormattedTimeSuffix({ date, lang })}`;
}

function getLocalDayOffset(params: { date: Date; referenceDate: Date }): number {
    const { date, referenceDate } = params;

    return Math.round((getDayStamp(date) - getDayStamp(referenceDate)) / DAY_MS);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function getDayStamp(date: Date): number {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function getFormattedTimeSuffix(params: { date: Date; lang: string }): string {
    const { date, lang } = params;

    const parts = new Intl.DateTimeFormat(lang, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "numeric",
        minute: "2-digit"
    }).formatToParts(date);

    const firstTimePartIndex = parts.findIndex(part =>
        ["hour", "minute", "dayPeriod"].includes(part.type)
    );

    if (firstTimePartIndex === -1) {
        return ` ${new Intl.DateTimeFormat(lang, {
            hour: "numeric",
            minute: "2-digit"
        }).format(date)}`;
    }

    const startIndex =
        parts[firstTimePartIndex - 1]?.type === "literal"
            ? firstTimePartIndex - 1
            : firstTimePartIndex;

    return parts
        .slice(startIndex)
        .map(part => part.value)
        .join("");
}

function capitalizeFirstLetter(params: { text: string; lang: string }): string {
    const { text, lang } = params;

    return `${text.charAt(0).toLocaleUpperCase(lang)}${text.slice(1)}`;
}
