import { createOnyxiaUi, defaultGetTypographyDesc } from "onyxia-ui";
import { palette } from "ui/theme/palette";
import { targetWindowInnerWidth } from "ui/theme/targetWindowInnerWidth";
import { env } from "env-parsed";
import { loadThemedFavicon as loadThemedFavicon_base } from "ui/theme/loadThemedFavicon";
import { Evt } from "evt";

const { OnyxiaUi, evtTheme } = createOnyxiaUi({
    "getTypographyDesc": params => ({
        ...defaultGetTypographyDesc({
            ...params,
            // NOTE: Prevent the font from being responsive.
            "windowInnerWidth": targetWindowInnerWidth
        }),
        "fontFamily": `'${env.FONT.fontFamily}', 'Roboto', sans-serif`
    }),
    palette,
    "splashScreenParams": undefined,
    // NOTE: Equivalent to join(env.CUSTOM_RESOURCES_URL, "..")
    "BASE_URL": env.CUSTOM_RESOURCES_URL.replace(/\/[^/]*\/?$/, "")
});

export { OnyxiaUi };

export const loadThemedFavicon = () =>
    loadThemedFavicon_base({
        "evtTheme": Evt.loosenType(evtTheme)
    });
