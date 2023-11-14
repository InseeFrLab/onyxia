import { createThemeProvider, defaultGetTypographyDesc } from "onyxia-ui";
import { palette } from "./palette";
import { targetWindowInnerWidth } from "./targetWindowInnerWidth";
import { env } from "env-parsed";
import servicesSvgUrl from "ui/assets/svg/custom-icons/services.svg";
import secretsSvgUrl from "ui/assets/svg/custom-icons/secrets.svg";
import accountSvgUrl from "ui/assets/svg/custom-icons/account.svg";
import homeSvgUrl from "ui/assets/svg/custom-icons/home.svg";
import filesSvgUrl from "ui/assets/svg/custom-icons/files.svg";
import catalogSvgUrl from "ui/assets/svg/custom-icons/catalog.svg";

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
    "publicUrl": process.env.PUBLIC_URL
});

export { ThemeProvider };

export type Theme = typeof ofTypeTheme;

export const customIcons = {
    servicesSvgUrl,
    secretsSvgUrl,
    accountSvgUrl,
    homeSvgUrl,
    filesSvgUrl,
    catalogSvgUrl
};
