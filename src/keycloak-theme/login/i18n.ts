import { createUseI18n } from "keycloakify/login";

export const { useI18n } = createUseI18n({
    "en": {
        "alphanumericalCharsOnly": "Only alphanumerical characters"
    },
    "fr": {
        /* spell-checker: disable */
        "alphanumericalCharsOnly": "Caractère alphanumérique uniquement"
        /* spell-checker: enable */
    }
});

export type I18n = NonNullable<ReturnType<typeof useI18n>>;
