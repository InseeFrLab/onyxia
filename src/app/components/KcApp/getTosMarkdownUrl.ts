
import type { KcLanguageTag } from "keycloakify";
import tos_fr_url from "app/assets/md/tos_fr.md";
import tos_en_url from "app/assets/md/tos_en.md";

export function getTosMarkdownUrl(kcLanguageTag: KcLanguageTag): string {
    switch (kcLanguageTag) {
        case "fr": return tos_fr_url;
        default: return tos_en_url;
    }
}