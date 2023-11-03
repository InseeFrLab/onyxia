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
import {
    THEME_ID,
    PALETTE_OVERRIDE,
    FAVICON
} from "keycloak-theme/login/envCarriedOverToKc";
import { mergeDeep } from "ui/tools/mergeDeep";
import { AnimatedOnyxiaLogo } from "onyxia-ui/AnimatedOnyxiaLogo";
import { $lang, resolveLocalizedString } from "ui/i18n";
import { statefulObservableToStatefulEvt } from "powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt";
import { resolveAssetVariantUrl } from "ui/shared/AssetVariantUrl";
import servicesSvgUrl from "ui/assets/svg/custom-icons/services.svg";
import secretsSvgUrl from "ui/assets/svg/custom-icons/secrets.svg";
import accountSvgUrl from "ui/assets/svg/custom-icons/account.svg";
import homeSvgUrl from "ui/assets/svg/custom-icons/home.svg";
import filesSvgUrl from "ui/assets/svg/custom-icons/files.svg";
import catalogSvgUrl from "ui/assets/svg/custom-icons/catalog.svg";
import { Evt } from "evt";

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
    Evt.merge([
        evtIsDarkModeEnabled,
        statefulObservableToStatefulEvt({ "statefulObservable": $lang })
    ])
        .toStateful()
        .attach(async () => {
            const isDarkModeEnabled = evtIsDarkModeEnabled.state;

            const svgUrl = resolveAssetVariantUrl({
                resolveLocalizedString,
                isDarkModeEnabled,
                "assetVariantUrl": FAVICON
            });

            const rawSvgString = await fetch(svgUrl)
                .then(response => response.text())
                .catch(() => undefined);

            if (rawSvgString === undefined) {
                console.warn(`Failed to fetch favicon ${svgUrl}`);
                return;
            }

            const svgRoot = (() => {
                let svgElement: SVGSVGElement | null;

                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(rawSvgString, "image/svg+xml");
                    svgElement = doc.querySelector("svg");
                } catch (error) {
                    console.error(`Failed to parse ${svgUrl}, ${String(error)}`);
                    return undefined;
                }

                if (svgElement === null) {
                    console.error(`${svgUrl} is empty`);
                    return undefined;
                }

                return svgElement;
            })();

            if (svgRoot === undefined) {
                return;
            }

            const colorUsecases = createDefaultColorUseCases({
                palette,
                isDarkModeEnabled
            });

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

            const link =
                document.querySelector("link[rel*='icon']") ??
                document.createElement("link");
            Object.assign(link, { "rel": "icon", "type": "image/svg+xml", "href": url });

            document.getElementsByTagName("head")[0].appendChild(link);
        });
}

export const customIcons = {
    servicesSvgUrl,
    secretsSvgUrl,
    accountSvgUrl,
    homeSvgUrl,
    filesSvgUrl,
    catalogSvgUrl
};
