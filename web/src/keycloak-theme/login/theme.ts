import { createThemeProvider, defaultGetTypographyDesc } from "onyxia-ui";
import { palette } from "ui/theme/palette";
import { loadThemedFavicon } from "ui/theme/loadThemedFavicon";
import { targetWindowInnerWidth } from "ui/theme/targetWindowInnerWidth";
import { env } from "env-parsed";

export const { ThemeProvider } = createThemeProvider({
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
