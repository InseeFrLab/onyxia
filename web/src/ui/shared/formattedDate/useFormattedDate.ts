import { useMemo, useEffect, useState } from "react";
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

    const { lang } = useLang();

    const [fromNowText, setFromNowText] = useState(() => fromNow({ dateTime }));

    useEffect(() => {
        const updateText = () => {
            const newText = fromNow({ dateTime });

            if (fromNowText !== newText) {
                setFromNowText(newText);
            }
        };

        updateText();

        const timer = setInterval(updateText, 1000);

        return () => {
            clearInterval(timer);
        };
    }, [dateTime, lang]);

    return { fromNowText };
}
