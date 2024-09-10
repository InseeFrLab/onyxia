import type { Preview } from "@storybook/react";
import { useDarkMode as useStorybookUiDarkMode } from "storybook-dark-mode";
import { darkTheme, lightTheme } from "./theme";
import React, { useEffect } from "react";
import { OnyxiaUi } from "../src/ui/theme";
import { injectCustomFontFaceIfNotAlreadyDone } from "../src/ui/theme/injectCustomFontFaceIfNotAlreadyDone";
import {
    I18nFetchingSuspense,
    Language,
    languages,
    languagesPrettyPrint,
    useLang,
    fallbackLanguage
} from "../src/ui/i18n";
import { assert } from "tsafe/assert";
import { is } from "tsafe/is";

injectCustomFontFaceIfNotAlreadyDone();

const languagesGlobal = Object.entries(languagesPrettyPrint).map(([value, title]) => ({
    value: value as Language,
    title
}));

const globalTypes = {
    locale: {
        name: "Locale",
        description: "Internationalization locale",
        defaultValue: fallbackLanguage,
        toolbar: {
            icon: "globe",
            items: languagesGlobal
        }
    }
};
const preview: Preview = {
    parameters: {
        backgrounds: { disable: true },
        darkMode: {
            light: lightTheme,
            dark: darkTheme
        },
        docs: { disable: true, hidden: true }
    },
    globalTypes,
    argTypes: {},
    decorators: [
        (Story, { globals: { locale } }) => {
            const isStorybookUiDark = useStorybookUiDarkMode();
            const { lang, setLang } = useLang();

            assert(is<Language>(locale));

            useEffect(() => {
                if (lang !== locale) setLang(locale);
            }, [locale]);

            return (
                <I18nFetchingSuspense>
                    <OnyxiaUi darkMode={isStorybookUiDark}>
                        <Story />
                    </OnyxiaUi>
                </I18nFetchingSuspense>
            );
        }
    ]
};

export default preview;
