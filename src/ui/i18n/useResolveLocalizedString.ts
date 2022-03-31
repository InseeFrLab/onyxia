import { useMemo } from "react";
import { createResolveLocalizedString } from "core/tools/resolveLocalizedString";
import type { LocalizedString as GenericLocalizedString } from "core/tools/resolveLocalizedString";
import { useLng, fallbackLanguage } from "./useLng";
import type { Language } from "./useLng";

export type LocalizedString = GenericLocalizedString<Language>;

export function useResolveLocalizedString() {
    const { lng } = useLng();

    const { resolveLocalizedString } = useMemo(
        () =>
            createResolveLocalizedString({
                "currentLanguage": lng,
                fallbackLanguage,
            }),
        [lng],
    );

    return { resolveLocalizedString };
}
