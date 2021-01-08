
import { useMemo } from "react";
import ScopedCssBaseline from '@material-ui/core/ScopedCssBaseline';
import { ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import memoize from "memoizee";
import { withProps } from "app/utils/withProps";
import { createTheme } from "./theme";



function ThemeProvider(
    props: {
        /** Higher order */
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





