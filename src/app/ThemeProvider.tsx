
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
import { ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import memoize from "memoizee";
import { withProps } from "app/utils/withProps";


function createTheme(
    params: {
        isReactStrictModeEnabled: boolean;
        isDarkModeEnabled: boolean;
    }
) {

    const { isReactStrictModeEnabled, isDarkModeEnabled } = params;

    const theme =
        responsiveFontSizes( //https://material-ui.com/customization/theming/#responsivefontsizes-theme-options-theme
            (isReactStrictModeEnabled ?
                unstable_createMuiStrictModeTheme :
                createMuiTheme
            )({ // https://material-ui.com/customization/palette/#using-a-color-object
                "palette": {
                    ...(!isDarkModeEnabled ? {} : { "type": "dark" }),
                    "primary": {
                        "light": "#FFD6CC",
                        "main": "#FF562C",
                        "contrastText": "#F5F5F5"
                    },
                    "secondary": {
                        "light": "#525966",
                        "main": "#2C323F",
                        "contrastText": "#F5F5F5"
                    }
                }
            })
        );

    return { theme };

};

function ThemeProvider(
    props: {
        isReactStrictModeEnabled: boolean;
        isDarkModeEnabled: boolean;
        children: React.ReactNode;

    }
) {

    const { 
        isReactStrictModeEnabled, 
        isDarkModeEnabled,
        children
    } = props;

    const { theme } = useMemo(
        () => memoize(
            (isDarkModeEnabled: boolean) =>
                createTheme({
                    isReactStrictModeEnabled,
                    isDarkModeEnabled
                })
        ),
        [isReactStrictModeEnabled]
    )(isDarkModeEnabled);

    return (
        <MuiThemeProvider theme={theme}>
            <ScopedCssBaseline>
                {children}
            </ScopedCssBaseline>
        </MuiThemeProvider>
    );


}

export function ThemeProviderFactory(
    params: {
        isReactStrictModeEnabled: boolean;
    }
) {

    const { isReactStrictModeEnabled } = params;

    return {
        "ThemeProvider": withProps(
            ThemeProvider,
            { isReactStrictModeEnabled }
        )
    }


}





