import { createResolveLocalizedStringFactory } from "i18nifty/LocalizedString/LocalizedString";
import { env } from "env";

const { createResolveLocalizedString } = createResolveLocalizedStringFactory({
    createJsxElement: ({ text, lang }) => ({ text, lang })
});

export async function downloadTermsMarkdown(params: {
    currentLanguageTag: string;
}): Promise<{ termsMarkdown: string; langOfTheTerms: string | undefined }> {
    const { currentLanguageTag } = params;

    if (env.TERMS_OF_SERVICES === undefined) {
        return { termsMarkdown: "No terms provided", langOfTheTerms: "en" };
    }

    const { resolveLocalizedString } = createResolveLocalizedString({
        currentLanguage: currentLanguageTag,
        fallbackLanguage: "en",
        labelWhenMismatchingLanguage: true
    });

    const { text: termsUrl, lang: langOfTheTerms } = resolveLocalizedString(
        env.TERMS_OF_SERVICES
    );

    const termsMarkdown = await fetch(termsUrl).then(r => r.text());

    return { termsMarkdown, langOfTheTerms };
}
