
import { useMemo } from "react";
import CssBaseline from '@material-ui/core/CssBaseline';
import { ZoomProvider } from "powerhooks";
import { useWindowInnerSize } from "powerhooks";

import { ThemeProvider as MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
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
            /** set to undefined to disable */
            zoomProviderReferenceWidth?: number;
            children: React.ReactNode;
        }
    ) {

        const {
            isDarkModeEnabled,
            zoomProviderReferenceWidth,
            children
        } = props;

        const { theme } = useMemo(
            () => createTheme({
                    isReactStrictModeEnabled,
                    isDarkModeEnabled
                }),
            [isDarkModeEnabled]
        );

        const { windowInnerHeight, windowInnerWidth } = useWindowInnerSize();

        const isLandscape = windowInnerWidth > windowInnerHeight;

        useEffectOnValueChange(
            () => {

                if (zoomProviderReferenceWidth === undefined) {
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
                    {
                        zoomProviderReferenceWidth !== undefined && !isLandscape ?
                            <p>
                                This app isn't compatible with landscape mode yet,
                                please enable the rotation sensor and flip your phone.
                            </p>
                            :
                            <ZoomProvider referenceWidth={zoomProviderReferenceWidth}>
                                {children}
                            </ZoomProvider>
                    }
                </StylesProvider>
            </MuiThemeProvider>
        );


    }

    return { ThemeProvider };

}


