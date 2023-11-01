import { createThemeProvider, defaultGetTypographyDesc } from "onyxia-ui";
import { createTss } from "tss-react";
import { palette, fontFamily } from "ui/theme";

const { useTheme, ThemeProvider } = createThemeProvider({
    "getTypographyDesc": params => ({
        ...defaultGetTypographyDesc(params),
        fontFamily
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
