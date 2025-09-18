import { z } from "zod";
import {
    type Language,
    type LocalizedString,
    languages,
    zLanguage
} from "core/ports/OnyxiaApi";

function isLanguage(x: string): x is Language {
    return (languages as readonly string[]).includes(x);
}

const languageTranslationTags = languages.flatMap(target =>
    languages
        .filter(source => source !== target)
        .map(source => `${target}-t-${source}` as const)
) as readonly `${Language}-t-${Language}`[];

export const zLanguage_BCP47 = z.enum([
    ...languages,
    ...languageTranslationTags
] as const);

export const normalizeLang = (lang: string): Language | undefined => {
    const translationBase = lang.split("-t-")[0];
    if (isLanguage(translationBase)) {
        return translationBase;
    }

    const [primary] = lang.split("-");
    return primary !== undefined && isLanguage(primary) ? primary : undefined;
};

export const zLangValue = z.object({
    "@language": zLanguage_BCP47,
    "@value": z.string()
});

export const zLocalizedInput = z.union([
    z.string(), //value not localized
    z.object({ "@value": z.string() }), //Not localized
    z.array(zLangValue),
    z.record(zLanguage, z.string())
]);

export const zLocalizedArrayInput = z.union([zLocalizedInput, z.array(zLocalizedInput)]);

export function toLocalizedString(input: LdLocalizedInput): LocalizedString {
    if (typeof input === "string") {
        return input;
    }

    if (Array.isArray(input)) {
        const rec: Partial<Record<Language, string>> = {};
        for (const { "@language": lang, "@value": value } of input) {
            const normalizedLang = normalizeLang(lang);
            if (normalizedLang !== undefined) {
                rec[normalizedLang] = value;
            }
        }
        return rec;
    }

    if ("@value" in input) {
        return input["@value"];
    }

    return input;
}

export function toLocalizedStringList(input: LdLocalizedArrayInput): LocalizedString[] {
    const items = Array.isArray(input) ? input : [input];
    return items.map(value => toLocalizedString(value));
}

type LdLocalizedInput = z.infer<typeof zLocalizedInput>;
type LdLocalizedArrayInput = z.infer<typeof zLocalizedArrayInput>;
