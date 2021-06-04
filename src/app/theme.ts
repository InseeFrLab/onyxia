
import {
    createThemeProvider,
    defaultPalette,
    defaultTypography
} from "onyxia-ui";
import { createUseClassNamesFactory } from "tss-react";

export const { ThemeProvider, useTheme } = createThemeProvider({
    //We keep the default color palette but we add a custom color: a shiny pink.
    "typography": {
        ...defaultTypography,
        "fontFamily": '"Work Sans", sans-serif',
    },
    "palette": {
        ...defaultPalette,
        "limeGreen": {
            "main": "#BAFF29",
            "light": "#E2FFA6"
        }
    },
    "isReactStrictModeEnabled": process.env.NODE_ENV !== "production"
});

export const { createUseClassNames } = createUseClassNamesFactory({ useTheme });