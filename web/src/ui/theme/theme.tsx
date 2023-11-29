import { createOnyxiaUi, defaultGetTypographyDesc } from "onyxia-ui";
import { palette } from "./palette";
import { targetWindowInnerWidth } from "./targetWindowInnerWidth";
import { env } from "env-parsed";
import { loadThemedFavicon as loadThemedFavicon_base } from "./loadThemedFavicon";
import { Evt } from "evt";
import { CacheProvider } from "@emotion/react";
import { createCssAndCx } from "tss-react/cssAndCx";
import createCache from "@emotion/cache";
import { enableScreenScaler } from "screen-scaler/react";
import { pluginSystemInitTheme } from "pluginSystem";

// NOTE: This must happen very early-on, if overwrite some DOM APIs.
export const { ScreenScalerOutOfRangeFallbackProvider } = enableScreenScaler({
    "rootDivId": "root",
    "targetWindowInnerWidth": ({ zoomFactor, isPortraitOrientation }) =>
        isPortraitOrientation ? undefined : targetWindowInnerWidth * zoomFactor
});

/*
export const ScreenScalerOutOfRangeFallbackProvider = ({ children}: { 
    children: React.ReactNode;
    fallback?: React.ReactNode;
})=> {


    return (
        <>
            {children}
        </>
    );

}
*/

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
    "splashScreenParams": {
        "assetUrl": env.SPLASHSCREEN_LOGO,
        "assetScaleFactor": env.SPLASHSCREEN_LOGO_SCALE_FACTOR
    },
    "BASE_URL": env.PUBLIC_URL
});

const emotionCache = createCache({
    "key": "tss"
});

pluginSystemInitTheme({
    "evtTheme": Evt.loosenType(evtTheme),
    ...createCssAndCx({ "cache": emotionCache })
});

export function OnyxiaUi(props: { children: React.ReactNode }) {
    const { children } = props;
    return (
        <CacheProvider value={emotionCache}>
            <OnyxiaUiWithoutEmotionCache>{children}</OnyxiaUiWithoutEmotionCache>
        </CacheProvider>
    );
}

export type Theme = typeof ofTypeTheme;

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
