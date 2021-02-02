
import { useState } from "react";
import CssBaseline from '@material-ui/core/CssBaseline';
import { ZoomProvider } from "app/tools/hooks/useDOMRect";

import { ThemeProvider as MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import memoize from "memoizee";
import { createTheme } from "./theme";

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

        const { theme } = useState(
            () => memoize(
                (isDarkModeEnabled: boolean) =>
                    createTheme({
                        isReactStrictModeEnabled,
                        isDarkModeEnabled
                    })
            )
        )[0](isDarkModeEnabled);

        return (
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                <StylesProvider injectFirst>
                    <ZoomProvider referenceWidth={theme.custom.referenceWidth}>
                        {children}
                    </ZoomProvider>
                </StylesProvider>
            </MuiThemeProvider>
        );


    }

    return { ThemeProvider };

}


