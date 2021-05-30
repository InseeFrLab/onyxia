
import { useMemo } from "react";
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider as MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import { createMuiTheme } from "./createMuiTheme";

export function themeProviderFactory(
    params: {
        isReactStrictModeEnabled: boolean;
    }
) {

    const { isReactStrictModeEnabled } = params;

    function ThemeProvider(
        props: {
            isDarkModeEnabled: boolean;
            children: React.ReactNode;
        }
    ) {

        const {
            isDarkModeEnabled,
            children
        } = props;

        const { theme } = useMemo(
            () => createMuiTheme({
                isReactStrictModeEnabled,
                isDarkModeEnabled
            }),
            [isDarkModeEnabled]
        );

        return (
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                <StylesProvider injectFirst>
                    {children}
                </StylesProvider>
            </MuiThemeProvider>
        );

    }

    return { ThemeProvider };

}


