import { assert } from "tsafe/assert";

export function createResolveLocalizedString<Language extends string>(params: {
    currentLanguage: Language;
    fallbackLanguage: Language;
}) {
    const { currentLanguage, fallbackLanguage } = params;

    type LocalizedString = string | Partial<Record<Language, string>>;

    function resolveLocalizedString(localizedString: LocalizedString): string {
        if (typeof localizedString === "string") {
            return localizedString;
        }

        {
            const text = localizedString[currentLanguage];

            if (typeof text === "string") {
                return text;
            }
        }

        {
            const text = localizedString[fallbackLanguage];

            if (typeof text === "string") {
                return text;
            }
        }

        const text = Object.entries(localizedString)[0][1];

        assert(typeof text === "string", "Must contain at least one value");

        return text;
    }

    return { resolveLocalizedString };
}
