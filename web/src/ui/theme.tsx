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
import { env } from "env-parsed";
import { mergeDeep } from "ui/tools/mergeDeep";
import { AnimatedOnyxiaLogo } from "onyxia-ui/AnimatedOnyxiaLogo";
import { resolveAssetVariantUrl } from "ui/shared/AssetVariantUrl";
import { assert } from "tsafe/assert";
import servicesSvgUrl from "ui/assets/svg/custom-icons/services.svg";
import secretsSvgUrl from "ui/assets/svg/custom-icons/secrets.svg";
import accountSvgUrl from "ui/assets/svg/custom-icons/account.svg";
import homeSvgUrl from "ui/assets/svg/custom-icons/home.svg";
import filesSvgUrl from "ui/assets/svg/custom-icons/files.svg";
import catalogSvgUrl from "ui/assets/svg/custom-icons/catalog.svg";

export const palette = {
    ...(() => {
        const selectedBuiltinPalette = (() => {
            switch (env.THEME_ID) {
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

        return env.PALETTE_OVERRIDE !== undefined
            ? mergeDeep(selectedBuiltinPalette, env.PALETTE_OVERRIDE)
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

export const targetWindowInnerWidth = 1980;

export const { useTheme, ThemeProvider } = createThemeProvider({
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
    "splashScreenParams": { "Logo": AnimatedOnyxiaLogo },
    "publicUrl": ""
});

export async function loadThemedFavicon() {
    evtIsDarkModeEnabled.attach(async isDarkModeEnabled => {
        const faviconUrl = resolveAssetVariantUrl({
            isDarkModeEnabled,
            "assetVariantUrl": env.FAVICON
        });

        const link = document.querySelector("link[rel*='icon']");
        assert(link !== null, "Expect a favicon already present in the head");

        const linkProps = await (async (): Promise<
            { type: string; href: string } | undefined
        > => {
            if (!faviconUrl.endsWith(".svg")) {
                const extension = faviconUrl.split(".").pop();

                assert(
                    extension !== undefined && ["png", "ico"].includes(extension),
                    "Expect a png or ico favicon"
                );

                return {
                    "type": `image/${extension}`,
                    "href": faviconUrl
                };
            }

            const rawSvgString = await fetch(faviconUrl)
                .then(response => response.text())
                .catch(() => undefined);

            if (rawSvgString === undefined) {
                console.warn(`Failed to fetch favicon ${faviconUrl}`);
                return undefined;
            }

            const svgRoot = (() => {
                let svgElement: SVGSVGElement | null;

                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(rawSvgString, "image/svg+xml");
                    svgElement = doc.querySelector("svg");
                } catch (error) {
                    console.error(`Failed to parse ${faviconUrl}, ${String(error)}`);
                    return undefined;
                }

                if (svgElement === null) {
                    console.error(`${faviconUrl} is empty`);
                    return undefined;
                }

                return svgElement;
            })();

            if (svgRoot === undefined) {
                return undefined;
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

            return {
                "type": "image/svg+xml",
                "href": "data:image/svg+xml," + encodeURIComponent(updatedRawSvg)
            };
        })();

        if (linkProps === undefined) {
            return;
        }

        Object.assign(link, linkProps);

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
