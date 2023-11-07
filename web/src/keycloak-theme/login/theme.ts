import { createThemeProvider, defaultGetTypographyDesc } from "onyxia-ui";
import { palette, loadThemedFavicon, targetWindowInnerWidth } from "ui/theme";
import { env } from "env-parsed";

export const { useTheme, ThemeProvider } = createThemeProvider({
    "getTypographyDesc": params => ({
        ...defaultGetTypographyDesc({
            ...params,
            // NOTE: Prevent the font from being responsive.
            "windowInnerWidth": targetWindowInnerWidth
        }),
        "fontFamily": `'${env.FONT.fontFamily}'${
            env.FONT.fontFamily === "Work Sans" ? "" : ", 'Work Sans'"
        }`
    }),
    palette,
    "splashScreenParams": undefined,
    "publicUrl": undefined
});

export { loadThemedFavicon };
