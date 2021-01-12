
import { useMemo } from "react";
import type { SupportedLanguages } from "./resources";
import * as reactI18next from "react-i18next";
import moment from "moment";
import "moment/locale/fr";
import { assert } from "evt/tools/typeSafety/assert";
import { typeGuard } from "evt/tools/typeSafety/typeGuard";

export function useFormattedDate(
    params: {
        formatByLng: Record<SupportedLanguages, string>;
        date: Date;
    }


): string {

    const { formatByLng, date } = params;

    const { i18n: { language } } = reactI18next.useTranslation();

    assert(typeGuard<SupportedLanguages>(language));

    return useMemo(
        () => moment(date)
            .locale(language)
            .format(formatByLng[language]),
        [date, language, formatByLng]
    );

}