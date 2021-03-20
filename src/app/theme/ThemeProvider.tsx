
import { useState } from "react";
import CssBaseline from '@material-ui/core/CssBaseline';
import { ZoomProvider } from "powerhooks";
import { useWindowInnerSize } from "powerhooks";

import { ThemeProvider as MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import memoize from "memoizee";
import { createTheme } from "./theme";

import { useEffectOnValueChange } from "powerhooks";

export function themeProviderFactory(
    params: {
        isReactStrictModeEnabled: boolean;
    }
) {

    const { isReactStrictModeEnabled } = params;

    function ThemeProvider(
        props: {
            isDarkModeEnabled: boolean;
            doEnableZoom: boolean;
            children: React.ReactNode;
        }
    ) {

        const {
            isDarkModeEnabled,
            doEnableZoom,
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

        const { windowInnerHeight, windowInnerWidth } = useWindowInnerSize();

        const isLandscape = windowInnerWidth > windowInnerHeight;

        useEffectOnValueChange(
            () => {

                if (theme.custom.referenceWidth === undefined) {
                    return;
                }

                window.location.reload();
            },
            [isLandscape]
        );

        return (
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                <StylesProvider injectFirst>
                    <ZoomProvider referenceWidth={
                        (isLandscape && doEnableZoom) ?
                            theme.custom.referenceWidth : undefined
                    }
                    >
                        {children}
                    </ZoomProvider>
                </StylesProvider>
            </MuiThemeProvider>
        );


    }

    return { ThemeProvider };

}


