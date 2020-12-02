
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
import { ThemeProvider } from "@material-ui/core/styles";

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
        isReactStrictModeEnabled: boolean;
    }
) {

    const { 
        isReactStrictModeEnabled, 
    } = params;

    const { createAppTheme } = createAppThemeFactory(
        { isReactStrictModeEnabled }
    );

    function AppThemeProvider(
        props: {
            isDarkModeEnabled: boolean;
            children: React.ReactNode;
        }
    ) {

        const { children, isDarkModeEnabled } = props;

        const { theme } = useMemo(
            () => createAppTheme({ isDarkModeEnabled }),
            [isDarkModeEnabled]
        );

        return (
            <ThemeProvider theme={theme}>
                <ScopedCssBaseline>
                    {children}
                </ScopedCssBaseline>
            </ThemeProvider>
        );

    }

    return { AppThemeProvider };

}





