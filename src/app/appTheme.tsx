
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
import { useIsDarkModeEnabled } from "app/redux/hooks";

function createAppThemeFactory(
    params: {
        isReactStrictModeEnabled: boolean;
    }
) {

    const { isReactStrictModeEnabled } = params;

    function createAppTheme(
        params: {
            isDarkModeEnabled: boolean;
        }
    ) {

        const { isDarkModeEnabled } = params;

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

    return { createAppTheme };

}



export function AppThemeProviderFactory(
    params: {
        nodeEnv: "production" | "development" | "test"
    }
) {

    const { nodeEnv } = params;

    const { createAppTheme } = createAppThemeFactory(
        { "isReactStrictModeEnabled": nodeEnv !== "production" }
    );

    function AppThemeProvider(
        props: {
            children: React.ReactNode;
            nodeEnv: "production" | "development" | "test"
        }
    ) {

        const { children } = props;

        const { isDarkModeEnabled } = useIsDarkModeEnabled();

        const { theme } = useMemo(
            () => createAppTheme({ isDarkModeEnabled }),
            [isDarkModeEnabled]
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





