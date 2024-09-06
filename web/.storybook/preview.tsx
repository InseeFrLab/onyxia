import type { Preview } from "@storybook/react";
import { DocsContainer } from "./DocsContainer";
import { darkTheme, lightTheme } from "./theme";
import React from "react";
import { OnyxiaUi } from "../src/ui/theme";
import { withThemeFromJSXProvider } from "@storybook/addon-themes";

const preview: Preview = {
    parameters: {
        backgrounds: { disable: true },
        darkMode: {
            light: lightTheme,
            dark: darkTheme
        },
        docs: { disable: true, hidden: true }
    },
    argTypes: {
        darkMode: {
            control: { type: "boolean" },
            "description":
                "Global color scheme enabled, light or dark, it change only the color scheme of the Canvas"
        }
    },
    decorators: [
        (Story, {}) => {
            import("../src/ui/theme/injectCustomFontFaceIfNotAlreadyDone").then(
                ({ injectCustomFontFaceIfNotAlreadyDone }) =>
                    injectCustomFontFaceIfNotAlreadyDone()
            );
            return (
                <OnyxiaUi>
                    <Story />
                </OnyxiaUi>
            );
        }
    ]
};

export default preview;
