import { useI18n as useI18nBase } from "keycloakify";

type Props = Omit<Parameters<typeof useI18nBase>[0], "extraMessages">;

export function useI18n(props: Props) {
    const { kcContext } = props;
    return useI18nBase({
        kcContext,
        "extraMessages": {
            "en": {
                "alphanumericalCharsOnly": "Only alphanumerical characters",
            },
            "fr": {
                /* spell-checker: disable */
                "alphanumericalCharsOnly": "Caractère alphanumérique uniquement",
                /* spell-checker: enable */
            },
        },
    });
}

export type I18n = NonNullable<ReturnType<typeof useI18n>>;
