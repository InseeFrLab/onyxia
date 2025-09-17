import { z } from "zod";
import type { LocalizedString } from "ui/i18n";
import { zLanguage, languages } from "ui/i18n/z";

export const zLangValue = z.object({ "@language": zLanguage, "@value": z.string() });

export const zLocalizedInput = z.union([
    z.string(),
    z.object({ "@value": z.string() }),
    z.array(zLangValue),
    z.record(zLanguage, z.string())
]);

export const zLocalizedArrayInput = z.union([zLocalizedInput, z.array(zLocalizedInput)]);

export function toLocalizedString(input: LdLocalizedInput): LocalizedString {
    if (typeof input === "string") {
        return input;
    }

    if (Array.isArray(input)) {
        const allowed = new Set(languages);
        const rec: Record<string, string> = {};
        for (const { "@language": lang, "@value": value } of input) {
            if (allowed.has(lang)) {
                rec[lang] = value;
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
    return items.map(v => toLocalizedString(v));
}

type LdLocalizedInput = z.infer<typeof zLocalizedInput>;
type LdLocalizedArrayInput = z.infer<typeof zLocalizedArrayInput>;
