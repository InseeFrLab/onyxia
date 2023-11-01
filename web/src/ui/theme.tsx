import {
    createThemeProvider,
    defaultPalette,
    francePalette,
    ultravioletPalette,
    verdantPalette,
    defaultGetTypographyDesc,
    createDefaultColorUseCases,
    evtIsDarkModeEnabled
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

export async function applyFaviconColor() {
    const faviconSvgUrl = "/favicon.svg";

    const rawSvgString = await fetch(faviconSvgUrl)
        .then(response => response.text())
        .catch(() => undefined);

    if (rawSvgString === undefined) {
        console.warn(`Failed to fetch favicon ${faviconSvgUrl}`);
        return;
    }

    const svgRoot = (() => {
        let svgElement: SVGSVGElement | null;

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawSvgString, "image/svg+xml");
            svgElement = doc.querySelector("svg");
        } catch (error) {
            console.error(`Failed to parse ${faviconSvgUrl}, ${String(error)}`);
            return undefined;
        }

        if (svgElement === null) {
            console.error(`${faviconSvgUrl} is empty`);
            return undefined;
        }

        return svgElement;
    })();

    if (svgRoot === undefined) {
        return;
    }

    evtIsDarkModeEnabled.attach(isDarkModeEnabled => {
        const colorUsecases = createDefaultColorUseCases({ palette, isDarkModeEnabled });

        (function updateFillColor(element: Element) {
            for (const [className, color] of [
                ["focus-color-fill", colorUsecases.typography.textFocus],
                ["text-color-fill", colorUsecases.typography.textPrimary],
                ["surface-color-fill", colorUsecases.surfaces.surface1],
                ["background-color-fill", colorUsecases.surfaces.background]
            ] as const) {
                if (element.getAttribute("class")?.includes(className)) {
                    element.setAttribute("fill", color);
                }
            }

            // Recursively update child elements
            for (const child of Array.from(element.children)) {
                updateFillColor(child);
            }
        })(svgRoot);

        // Convert updated SVG DOM object back to string
        const serializer = new XMLSerializer();
        const updatedRawSvg = serializer.serializeToString(svgRoot);

        const url = "data:image/svg+xml," + encodeURIComponent(updatedRawSvg);

        const link: any = document.querySelector("link[rel*='icon']");
        link.type = "image/svg+xml";
        link.href = url;

        document.getElementsByTagName("head")[0].appendChild(link);
    });
}

export const customIcons = {
    "servicesSvgUrl": "/custom-icons/services_v1.svg",
    "secretsSvgUrl": "/custom-icons/secrets_v1.svg",
    "accountSvgUrl": "/custom-icons/account_v1.svg",
    "homeSvgUrl": "/custom-icons/home_v1.svg",
    "filesSvgUrl": "/custom-icons/files_v1.svg",
    "catalogSvgUrl": "/custom-icons/catalog_v1.svg"
};
