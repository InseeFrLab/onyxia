
//NOTE: This is not scoped
//https://material-ui.com/components/typography/#install-with-npm
import "fontsource-roboto/300.css";
import "fontsource-roboto/400.css";
import "fontsource-roboto/500.css";
import "fontsource-roboto/700.css";

import { createMuiTheme, unstable_createMuiStrictModeTheme } from '@material-ui/core/styles';
import { responsiveFontSizes } from "@material-ui/core/styles";
import React, { useMemo } from 'react';
import ScopedCssBaseline from '@material-ui/core/ScopedCssBaseline';
import { ThemeProvider, StylesProvider } from "@material-ui/core/styles";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import useMediaQuery from '@material-ui/core/useMediaQuery';

const createAppTheme = (params: {
    isDarkModeEnabled: boolean;
    isReactStrictModeEnabled: boolean;
}) => {

    const {
        isDarkModeEnabled,
        isReactStrictModeEnabled
    } = params;

    const theme =
        responsiveFontSizes( //https://material-ui.com/customization/theming/#responsivefontsizes-theme-options-theme
            (isReactStrictModeEnabled ?
                unstable_createMuiStrictModeTheme :
                createMuiTheme
            )({ // https://material-ui.com/customization/palette/#using-a-color-object
                "palette": {
                    ...(!isDarkModeEnabled ? {} : { "type": "dark" })
                }
            })
        );

    return { theme };

};


export function AppThemeProviderFactory(
    params: {
        nodeEnv: "production" | "development" | "test"
    }
) {

    const { nodeEnv } = params;

    function AppThemeProvider(
        props: {
            children: React.ReactNode;
            nodeEnv: "production" | "development" | "test"
        }
    ) {

        const { children } = props;

        const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

        const { theme } = useMemo(
            () => createAppTheme({
                "isDarkModeEnabled": prefersDarkMode,
                "isReactStrictModeEnabled": nodeEnv !== "production"
            }),
            [prefersDarkMode]
        );

        return (
            <ThemeProvider theme={theme}>
                <StyledThemeProvider theme={theme}> {/*https://material-ui.com/guides/interoperability/#theme*/}
                    <StylesProvider injectFirst> {/*https://material-ui.com/guides/interoperability/#controlling-priority*/}
                        <ScopedCssBaseline>
                            {children}
                        </ScopedCssBaseline>
                    </StylesProvider>
                </StyledThemeProvider>
            </ThemeProvider>
        );

    }

    return { AppThemeProvider };

}





