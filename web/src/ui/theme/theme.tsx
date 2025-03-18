/* eslint-disable react-refresh/only-export-components */
import { createOnyxiaUi, defaultGetTypographyDesc } from "onyxia-ui";
import { getPalette } from "./palette";
import { env } from "env";
import { loadThemedFavicon as loadThemedFavicon_base } from "./loadThemedFavicon";
import { Evt } from "evt";
import { CacheProvider } from "@emotion/react";
import { pluginSystemInitTheme } from "pluginSystem";
import { targetWindowInnerWidth } from "ui/theme/targetWindowInnerWidth";
import { isStorybook } from "ui/tools/isStorybook";
import { css, cx, emotionCache } from "./emotionCache";

const {
    OnyxiaUi: OnyxiaUiWithoutEmotionCache,
    evtTheme,
    ofTypeTheme
} = createOnyxiaUi({
    getTypographyDesc: params => ({
        ...defaultGetTypographyDesc({
            ...params,
            // We don't want the font to be responsive
            // By default, the font size change depending on the screen size,
            // we don't want that here so we fix the windowInnerWidth.
            windowInnerWidth: targetWindowInnerWidth
        }),
        fontFamily: `'${env.FONT.fontFamily}'`
    }),
    palette: getPalette,
    splashScreenParams: isStorybook
        ? undefined
        : {
              assetUrl: env.SPLASHSCREEN_LOGO,
              assetScaleFactor: env.SPLASHSCREEN_LOGO_SCALE_FACTOR,
              minimumDisplayDuration: 0
          }
});

pluginSystemInitTheme({
    evtTheme: Evt.loosenType(evtTheme),
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

export const loadThemedFavicon = () =>
    loadThemedFavicon_base({ evtTheme: Evt.loosenType(evtTheme) });
