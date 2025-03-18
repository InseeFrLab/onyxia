import { createOnyxiaUi, defaultGetTypographyDesc } from "onyxia-ui";
import { getPalette } from "ui/theme/palette";
import { targetWindowInnerWidth } from "ui/theme/targetWindowInnerWidth";
import { env } from "env";
import { loadThemedFavicon as loadThemedFavicon_base } from "ui/theme/loadThemedFavicon";
import { Evt } from "evt";

const { OnyxiaUi, evtTheme } = createOnyxiaUi({
    getTypographyDesc: params => ({
        ...defaultGetTypographyDesc({
            ...params,
            // NOTE: Prevent the font from being responsive.
            windowInnerWidth: targetWindowInnerWidth
        }),
        fontFamily: `'${env.FONT.fontFamily}', 'Roboto', sans-serif`
    }),
    palette: getPalette,
    splashScreenParams: undefined
});

export { OnyxiaUi };

export const loadThemedFavicon = () =>
    loadThemedFavicon_base({
        evtTheme: Evt.loosenType(evtTheme)
    });
