import { createDefaultColorUseCases } from "onyxia-ui";
import { getClassesAndColors } from "onyxia-ui/ThemedSvg";
import { env } from "env-parsed";
import { resolveThemedAssetUrl } from "onyxia-ui";
import { assert } from "tsafe/assert";
import { palette } from "./palette";
import type { StatefulReadonlyEvt } from "evt";
import domPurify from "dompurify";

export async function loadThemedFavicon(params: {
    evtIsDarkModeEnabled: StatefulReadonlyEvt<boolean>;
}) {
    const { evtIsDarkModeEnabled } = params;

    evtIsDarkModeEnabled.attach(async isDarkModeEnabled => {
        const faviconUrl = resolveThemedAssetUrl({
            isDarkModeEnabled,
            "themedAssetUrl": env.FAVICON
        });

        const link = document.createElement("link");

        link.rel = "icon";

        const linkProps = await (async (): Promise<
            { type: string; href: string } | undefined
        > => {
            const extension = faviconUrl.split("?")[0].split(".").pop();

            if (extension !== "svg") {
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
                    const doc = parser.parseFromString(
                        domPurify.sanitize(rawSvgString, {
                            "USE_PROFILES": { "svg": true }
                        }),
                        "image/svg+xml"
                    );
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

            const useCases = createDefaultColorUseCases({
                palette,
                isDarkModeEnabled
            });

            (function updateFillColor(element: Element) {
                getClassesAndColors({ palette, useCases }).forEach(
                    ({ className, color }) => {
                        if (element.getAttribute("class")?.includes(className)) {
                            element.setAttribute("fill", color);
                        }
                    }
                );

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

        {
            const existingLink = document.querySelector("link[rel*='icon']");

            if (existingLink) {
                existingLink.remove();
            }
        }

        document.getElementsByTagName("head")[0].prepend(link);
    });
}
