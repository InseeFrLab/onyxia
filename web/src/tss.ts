import { createTss } from "tss-react";
import { useTheme as useAppTheme } from "ui/theme";
import { useTheme as useLoginTheme } from "keycloak-theme/login/theme";
import { kcContext as kcLoginThemeContext } from "keycloak-theme/login/kcContext";

const useTheme = kcLoginThemeContext === undefined ? useAppTheme : useLoginTheme;

export const { tss } = createTss({
    "useContext": function useContext() {
        const theme = useTheme();
        return { theme };
    }
});

export const useStyles = tss.create({});
