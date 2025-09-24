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
export type LangValue = z.infer<typeof zLangValue>;

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

type LocalizedMap = Partial<Record<Language, string>>;

const isLangValue = (value: unknown): value is LangValue =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>)["@language"] === "string" &&
    typeof (value as Record<string, unknown>)["@value"] === "string";

export const groupLangValues = (values: LangValue[]): LocalizedString[] => {
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

    const results: LocalizedMap[] = [];

    // Step 2: Extract values that are exactly the same across multiple languages
    const valueToLangs = new Map<string, Language[]>();
    for (const [lang, items] of groups) {
        for (const val of items) {
            valueToLangs.set(val, [...(valueToLangs.get(val) ?? []), lang]);
        }
    }

    for (const [val, langs] of valueToLangs) {
        if (langs.length > 1) {
            const rec: LocalizedMap = {};
            langs.forEach(lang => {
                rec[lang] = val;
                // Remove this value from its language group to avoid reusing it
                const arr = groups.get(lang);
                if (arr) {
                    const idx = arr.indexOf(val);
                    if (idx >= 0) arr.splice(idx, 1);
                }
            });
            results.push(rec);
        }
    }

    // Step 3: Align the remaining values by their index
    const entries = [...groups.entries()];
    const numberOfValues = Math.max(...entries.map(([, items]) => items.length));

    const alignedRecords = Array.from({ length: numberOfValues }, (_, index) =>
        entries.reduce<LocalizedMap>((acc, [lang, items]) => {
            const item = items[index];
            return item !== undefined ? { ...acc, [lang]: item } : acc;
        }, {})
    ).filter(r => Object.keys(r).length > 0);

    return [...results, ...alignedRecords];
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
