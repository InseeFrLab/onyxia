/* eslint-disable react-refresh/only-export-components */
import { createOnyxiaUi, defaultGetTypographyDesc } from "onyxia-ui";
import { palette } from "./palette";
import { targetWindowInnerWidth } from "./targetWindowInnerWidth";
import { env } from "env";
import { loadThemedFavicon as loadThemedFavicon_base } from "./loadThemedFavicon";
import { Evt } from "evt";
import { CacheProvider } from "@emotion/react";
import { createCssAndCx } from "tss-react/cssAndCx";
import createCache from "@emotion/cache";
import { pluginSystemInitTheme } from "pluginSystem";
import { isStorybook } from "ui/tools/isStorybook";

const {
    OnyxiaUi: OnyxiaUiWithoutEmotionCache,
    evtTheme,
    ofTypeTheme
} = createOnyxiaUi({
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
    "splashScreenParams": isStorybook
        ? undefined
        : {
              "assetUrl": env.SPLASHSCREEN_LOGO,
              "assetScaleFactor": env.SPLASHSCREEN_LOGO_SCALE_FACTOR,
              "minimumDisplayDuration": 0
          },
    "BASE_URL": env.PUBLIC_URL
});

const emotionCache = createCache({
    "key": "tss"
});

export const { css, cx } = createCssAndCx({ "cache": emotionCache });

pluginSystemInitTheme({
    "evtTheme": Evt.loosenType(evtTheme),
    css,
    cx
});

export function OnyxiaUi(props: { children: React.ReactNode; darkMode?: boolean }) {
    const { children, darkMode } = props;
    return (
        <CacheProvider value={emotionCache}>
            <OnyxiaUiWithoutEmotionCache darkMode={darkMode ?? env.DARK_MODE}>
                {children}
            </OnyxiaUiWithoutEmotionCache>
        </CacheProvider>
    );
}

export type Theme = typeof ofTypeTheme;
export { evtTheme };

export const loadThemedFavicon = () =>
    loadThemedFavicon_base({ "evtTheme": Evt.loosenType(evtTheme) });

export const customIcons = {
    "servicesSvgUrl": `${env.PUBLIC_URL}/icons/services.svg?v=2`,
    "secretsSvgUrl": `${env.PUBLIC_URL}/icons/secrets.svg?v=2`,
    "accountSvgUrl": `${env.PUBLIC_URL}/icons/account.svg?v=2`,
    "homeSvgUrl": `${env.PUBLIC_URL}/icons/home.svg?v=2`,
    "filesSvgUrl": `${env.PUBLIC_URL}/icons/files.svg?v=2`,
    "catalogSvgUrl": `${env.PUBLIC_URL}/icons/catalog.svg?v=2`
};
