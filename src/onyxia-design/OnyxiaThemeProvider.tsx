import { useMemo } from "react";
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider as MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import { createTheme } from "./createTheme";

export function onyxiaThemeProviderFactory(
    params: {
        isReactStrictModeEnabled: boolean;
    }
) {

    const { isReactStrictModeEnabled } = params;

    function OnyxiaThemeProvider(
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
            () => createTheme({
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

    return { OnyxiaThemeProvider };

}
