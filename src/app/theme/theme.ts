


import { createMuiTheme, unstable_createMuiStrictModeTheme } from '@material-ui/core/styles';
import { responsiveFontSizes } from "@material-ui/core/styles";

// @ts-ignore: unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Theme, ThemeOptions } from "@material-ui/core/styles/createMuiTheme";

import { typography, muiTypographyOptions } from "./typography";
import { getColors, getMuiPaletteOption } from "./colors";
import { shadows } from "./shadows";

declare module "@material-ui/core/styles/createMuiTheme" {

    interface Theme {
        /** https://www.figma.com/file/vYJVgJU2OZQ96MkhRwNlMZ/NEW-UI-V2?node-id=1%3A1711 */
        custom: {
            typography: typeof typography;
            colors: ReturnType<typeof getColors>;
            shadows: typeof shadows;
            referenceWidth?: number;
        }
    }
    // allow configuration using `createMuiTheme`
    interface ThemeOptions {
        custom: Theme["custom"];
    }
}

export function createTheme(
    params: {
        isReactStrictModeEnabled: boolean;
        isDarkModeEnabled: boolean;
    }
) {

    const { isReactStrictModeEnabled, isDarkModeEnabled } = params;

    const paletteType = isDarkModeEnabled ? "dark" : "light"

    const theme =
        responsiveFontSizes( //https://material-ui.com/customization/theming/#responsivefontsizes-theme-options-theme
            (isReactStrictModeEnabled ?
                unstable_createMuiStrictModeTheme :
                createMuiTheme
            )({ // https://material-ui.com/customization/palette/#using-a-color-object
                "typography": muiTypographyOptions,
                "palette": getMuiPaletteOption(paletteType),
                "spacing": factor => 8 * factor,
                "custom": {
                    typography,
                    "colors": getColors(paletteType),
                    shadows,
                    "referenceWidth": 1920
                },
            })
        );

    return { theme };

};
