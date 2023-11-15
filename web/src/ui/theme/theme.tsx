import { createThemeProvider, defaultGetTypographyDesc } from "onyxia-ui";
import { palette } from "./palette";
import { targetWindowInnerWidth } from "./targetWindowInnerWidth";
import { env } from "env-parsed";

const { ThemeProvider, ofTypeTheme } = createThemeProvider({
    "getTypographyDesc": params => ({
        ...defaultGetTypographyDesc({
            ...params,
            // We don't want the font to be responsive
            // By default, the font size change depending on the screen size,
            // we don't want that here so we fix the windowInnerWidth.
            "windowInnerWidth": targetWindowInnerWidth
        }),
        "fontFamily": `'${env.FONT.fontFamily}'`
    }),
    palette,
    "splashScreenParams": {
        "assetUrl": env.SPLASHSCREEN_LOGO,
        "assetScaleFactor": env.SPLASHSCREEN_LOGO_SCALE_FACTOR
    },
    "publicUrl": env.PUBLIC_URL
});

export { ThemeProvider };

export type Theme = typeof ofTypeTheme;

export const customIcons = {
    "servicesSvgUrl": `${env.PUBLIC_URL}/custom-icons/services.svg`,
    "secretsSvgUrl": `${env.PUBLIC_URL}/custom-icons/secrets.svg`,
    "accountSvgUrl": `${env.PUBLIC_URL}/custom-icons/account.svg`,
    "homeSvgUrl": `${env.PUBLIC_URL}/custom-icons/home.svg`,
    "filesSvgUrl": `${env.PUBLIC_URL}/custom-icons/files.svg`,
    "catalogSvgUrl": `${env.PUBLIC_URL}/custom-icons/catalog.svg`
};
