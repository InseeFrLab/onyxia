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
);

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
type LangValue = z.infer<typeof zLangValue>;

export const zLocalizedInput = z.union([
    z.string(),
    z.object({ "@value": z.string() }),
    z.array(zLangValue),
    z.record(zLanguage, z.string())
]);

export const zLocalizedArrayInput = z.union([
    z.array(zLangValue), //needs to be at top to avoid conflict with other schema
    zLocalizedInput,
    z
        .union([
            z.string(),
            z.object({ "@value": z.string() }),
            z.record(zLanguage, z.string())
        ])
        .array()
]);

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

const isLangValue = (value: unknown): value is LangValue =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>)["@language"] === "string" &&
    typeof (value as Record<string, unknown>)["@value"] === "string";

const groupLangValues = (values: LangValue[]): LocalizedString[] => {
    // 1. Group values by normalized language
    const groups = values.reduce<Map<Language, string[]>>(
        (acc, { "@language": lang, "@value": value }) => {
            const normalized = normalizeLang(lang);
            if (!normalized) return acc;
            acc.set(normalized, [...(acc.get(normalized) ?? []), value]);
            return acc;
        },
        new Map()
    );

    if (groups.size === 0) return [];

    const entries = [...groups.entries()];
    const numberOfValues = Math.max(...entries.map(([, items]) => items.length));

    // 3. Build the result by aligning items at the same index across languages
    // We can't be sure translation are well aligned
    return Array.from({ length: numberOfValues }, (_, index) => {
        const record = entries.reduce<Partial<Record<Language, string>>>(
            (acc, [lang, items]) => {
                const item = items[index];
                return item !== undefined ? { ...acc, [lang]: item } : acc;
            },
            {}
        );
        return Object.keys(record).length > 0 ? record : undefined;
    }).filter(r => r !== undefined);
};

export function toLocalizedStringList(input: LdLocalizedArrayInput): LocalizedString[] {
    if (!Array.isArray(input)) {
        return [toLocalizedString(input)];
    }

    if (input.every(isLangValue)) {
        return groupLangValues(input as LangValue[]);
    }

    return input.map(value => toLocalizedString(value));
}

type LdLocalizedInput = z.infer<typeof zLocalizedInput>;
type LdLocalizedArrayInput = z.infer<typeof zLocalizedArrayInput>;
