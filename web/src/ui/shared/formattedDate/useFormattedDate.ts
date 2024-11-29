import { useMemo, useEffect, useReducer } from "react";
import { useLang } from "ui/i18n";
import { getFormattedDate } from "./getFormattedDate";
import { fromNow } from "./dateTimeFormatter";

export function useFormattedDate(params: { time: number }): string {
    const { time } = params;

    // NOTE: So that we get a refresh when the lang is changed.
    const { lang } = useLang();

    return useMemo(() => getFormattedDate({ time, lang }), [time, lang]);
}

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
