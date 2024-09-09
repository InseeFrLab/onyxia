import type { Preview } from "@storybook/react";
import { useDarkMode as useStorybookUiDarkMode } from "storybook-dark-mode";
import { darkTheme, lightTheme } from "./theme";
import React from "react";
import { OnyxiaUi } from "../src/ui/theme";
import { injectCustomFontFaceIfNotAlreadyDone } from "../src/ui/theme/injectCustomFontFaceIfNotAlreadyDone";

injectCustomFontFaceIfNotAlreadyDone();

const preview: Preview = {
    parameters: {
        backgrounds: { disable: true },
        darkMode: {
            light: lightTheme,
            dark: darkTheme
        },
        docs: { disable: true, hidden: true }
    },
    argTypes: {},
    decorators: [
        (Story, {}) => {
            const isStorybookUiDark = useStorybookUiDarkMode();

            return (
                <OnyxiaUi darkMode={isStorybookUiDark}>
                    <Story />
                </OnyxiaUi>
            );
        }
    ]
};

export default preview;
