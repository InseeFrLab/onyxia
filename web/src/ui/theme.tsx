import {
    createThemeProvider,
    defaultPalette,
    francePalette,
    ultravioletPalette,
    verdantPalette,
    defaultGetTypographyDesc
} from "onyxia-ui";
import { createTss } from "tss-react";
import { THEME_ID, PALETTE_OVERRIDE } from "keycloak-theme/login/envCarriedOverToKc";
import { mergeDeep } from "ui/tools/mergeDeep";
import { AnimatedOnyxiaLogo } from "onyxia-ui/AnimatedOnyxiaLogo";

export const palette = {
    ...(() => {
        const selectedBuiltinPalette = (() => {
            switch (THEME_ID) {
                case "onyxia":
                    return defaultPalette;
                case "france":
                    return francePalette;
                case "ultraviolet":
                    return ultravioletPalette;
                case "verdant":
                    return verdantPalette;
            }
        })();

        return PALETTE_OVERRIDE !== undefined
            ? mergeDeep(selectedBuiltinPalette, PALETTE_OVERRIDE)
            : selectedBuiltinPalette;
    })(),
    "limeGreen": {
        "main": "#BAFF29",
        "light": "#E2FFA6"
    },
    "agentConnectBlue": {
        "main": "#0579EE",
        "light": "#2E94FA",
        "lighter": "#E5EDF5"
    }
};

export const fontFamily = `${(() => {
    switch (THEME_ID) {
        case "france":
            return "Marianne";
        case "onyxia":
        case "ultraviolet":
        case "verdant":
            return '"Work Sans"';
    }
})()}, sans-serif`;

export const targetWindowInnerWidth = 1980;

const { useTheme, ThemeProvider } = createThemeProvider({
    "getTypographyDesc": params => ({
        ...defaultGetTypographyDesc({
            ...params,
            // We don't want the font to be responsive
            "windowInnerWidth": targetWindowInnerWidth
        }),
        fontFamily
    }),
    palette,
    "splashScreenParams": { "Logo": AnimatedOnyxiaLogo },
    "publicUrl": ""
});

export { ThemeProvider };

export const { tss } = createTss({
    "useContext": function useContext() {
        const theme = useTheme();
        return { theme };
    }
});

export const useStyles = tss.create({});

export function applyFaviconColor() {
    const color = palette.focus.main;

    // Define the SVG as a string
    const svg = `<svg viewBox="43 35 360 225.88" xmlns="http://www.w3.org/2000/svg">
                  <g fill="${color}">
                    <path d="M106.253 215.9L140.204 250.02C151.012 260.883 168.528 260.883 179.322 250.02L213.273 215.9L159.763 162.123L106.253 215.9Z"  />
                    <path d="M232.743 215.9L266.693 250.02C277.502 260.883 295.018 260.883 305.812 250.02L339.762 215.9L286.253 162.123L232.743 215.9Z"  />
                  </g>
                  <g fill="${color}">
                    <path d="M43 152.331L76.9508 186.452C87.7594 197.314 105.275 197.314 116.069 186.452L150.02 152.331L96.5099 98.5537L43 152.331Z"  />
                    <path d="M169.49 152.331L203.441 186.452C214.25 197.314 231.765 197.314 242.559 186.452L276.51 152.331L223 98.5537L169.49 152.331Z"  />
                    <path d="M349.49 98.5537L295.98 152.331L329.931 186.452C340.74 197.314 358.256 197.314 369.049 186.452L403 152.331L349.49 98.5537Z"  />
                  </g>
                  <g fill="${color}">
                    <path d="M232.743 88.7774L266.693 122.898C277.502 133.761 295.018 133.761 305.812 122.898L339.762 88.7774L286.253 35L232.743 88.7774Z"  />
                    <path d="M106.253 88.7774L140.204 122.898C151.012 133.761 168.528 133.761 179.322 122.898L213.273 88.7774L159.763 35L106.253 88.7774Z"  />   
                  </g>
                </svg>`;

    // Create a data URL from the SVG
    const url = "data:image/svg+xml," + encodeURIComponent(svg);

    // Set the favicon
    const link: any = document.querySelector("link[rel*='icon']");
    link.type = "image/svg+xml";
    link.href = url;

    // This is necessary in case a favicon already exists
    document.getElementsByTagName("head")[0].appendChild(link);
}

export const customIcons = {
    "servicesSvgUrl": "/custom-icons/services_v1.svg",
    "secretsSvgUrl": "/custom-icons/secrets_v1.svg",
    "accountSvgUrl": "/custom-icons/account_v1.svg",
    "homeSvgUrl": "/custom-icons/home_v1.svg",
    "filesSvgUrl": "/custom-icons/files_v1.svg",
    "catalogSvgUrl": "/custom-icons/catalog_v1.svg"
};
