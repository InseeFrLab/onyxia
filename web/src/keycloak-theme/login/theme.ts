import { createThemeProvider, defaultGetTypographyDesc } from "onyxia-ui";
import { createTss } from "tss-react";
import { palette, loadThemedFavicon, targetWindowInnerWidth } from "ui/theme";
import { FONT } from "./envCarriedOverToKc";

const { useTheme, ThemeProvider } = createThemeProvider({
    "getTypographyDesc": params => ({
        ...defaultGetTypographyDesc({
            ...params,
            // NOTE: Prevent the font from being responsive.
            "windowInnerWidth": targetWindowInnerWidth
        }),
        "fontFamily": `'${FONT.fontFamily}'${
            FONT.fontFamily === "Work Sans" ? "" : ", 'Work Sans'"
        }`
    }),
    palette,
    "splashScreenParams": undefined,
    "publicUrl": undefined
});

export { ThemeProvider };

export const { tss } = createTss({
    "useContext": function useContext() {
        const theme = useTheme();
        return { theme };
    }
});

export const useStyles = tss.create({});

export { loadThemedFavicon };
