
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

export function useValidUntil(
    params: {
        millisecondsLeft: number;
    }
): string {

    const { millisecondsLeft } = params;

    const { lng } = useLng();

    const validUntil = useMemo(
        () => moment()
            .locale(lng)
            .add(millisecondsLeft, "milliseconds")
            .calendar()
            .toLowerCase(),

        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lng, millisecondsLeft]
    );

    return validUntil;

}