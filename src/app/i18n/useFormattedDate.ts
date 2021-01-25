
import { useMemo } from "react";
import type { SupportedLanguage } from "./resources";
import * as reactI18next from "react-i18next";
import moment from "moment";
import "moment/locale/fr";

export function useFormattedDate(
    params: {
        formatByLng: Record<SupportedLanguage, string>;
        date: Date;
    }
): string {

    const { formatByLng, date } = params;

    const { i18n: { language } } = reactI18next.useTranslation();

    const supportedLanguage = language.split("-")[0] as SupportedLanguage;

    return useMemo(
        () => moment(date)
            .locale(language)
            .format(
                formatByLng[supportedLanguage]
            ),
        [date, supportedLanguage, language, formatByLng]
    );

}