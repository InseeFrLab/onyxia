import { getThemedSvgAsBlobUrl } from "onyxia-ui/ThemedSvg";
import { env } from "env";
import { resolveThemedAssetUrl } from "onyxia-ui/lib/ThemedAssetUrl";
import { assert } from "tsafe/assert";
import type { StatefulReadonlyEvt } from "evt";
import type { Theme } from "./theme";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";

export async function loadThemedFavicon(params: {
    evtTheme: StatefulReadonlyEvt<Theme>;
}) {
    const { evtTheme } = params;

    evtTheme
        .pipe(() => [
            {
                isDarkModeEnabled: evtTheme.state.isDarkModeEnabled,
                palette: evtTheme.state.colors.palette,
                useCases: evtTheme.state.colors.useCases
            }
        ])
        .pipe(onlyIfChanged())
        .attach(async ({ isDarkModeEnabled, palette, useCases }) => {
            const faviconUrl = resolveThemedAssetUrl({
                isDarkModeEnabled,
                themedAssetUrl: env.FAVICON
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
                        type: `image/${extension}`,
                        href: faviconUrl
                    };
                }

                let dataUrl: string;

                try {
                    dataUrl = await getThemedSvgAsBlobUrl({
                        isDarkModeEnabled,
                        svgUrl: faviconUrl,
                        palette,
                        useCases
                    });
                } catch (error) {
                    console.warn(`Failed to fetch favicon ${String(error)}`);
                    return undefined;
                }

                return {
                    type: "image/svg+xml",
                    href: dataUrl
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
