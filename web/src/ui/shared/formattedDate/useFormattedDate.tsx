import { useMemo, useEffect, useId } from "react";
import { useLang } from "ui/i18n";
import { getFormattedDate } from "./getFormattedDate";
import { fromNow } from "./dateTimeFormatter";
import { useConstCallback } from "powerhooks/useConstCallback";

export function useFormattedDate(params: { time: number }): string {
    const { time } = params;

    // NOTE: So that we get a refresh when the lang is changed.
    const { lang } = useLang();

    return useMemo(() => getFormattedDate({ time, lang }), [time, lang]);
}

export function useFromNow(params: { dateTime: number | undefined }) {
    const { dateTime } = params;

    const id = useId();

    const fromNowText = useMemo(() => <span id={id}></span>, [id]);

    const updateNode = useConstCallback(() => {
        if (dateTime === undefined) {
            return;
        }

        const el = document.getElementById(id);

        if (el === null) {
            return;
        }

        el.innerHTML = fromNow({ dateTime });
    });

    useEffect(() => {
        updateNode();
    }, [dateTime, id]);

    useEffect(() => {
        const timer = setInterval(updateNode, 1000);

        return () => clearInterval(timer);
    }, []);

    return { fromNowText };
}
