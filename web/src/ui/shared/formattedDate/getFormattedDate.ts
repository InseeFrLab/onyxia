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
