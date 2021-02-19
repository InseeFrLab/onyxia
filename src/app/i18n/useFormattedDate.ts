
import { useMemo } from "react";
import type { SupportedLanguage } from "./resources";
import moment from "moment";
import "moment/locale/fr";
import { useLng} from "./useLng";

export function useFormattedDate(
    params: {
        formatByLng: Record<SupportedLanguage, string>;
        date: Date;
    }
): string {

    const { formatByLng, date } = params;

    const { lng } = useLng();

    return useMemo(
        () => moment(date)
            .locale(lng)
            .format( formatByLng[lng]),
        [date, formatByLng, lng]
    );

}