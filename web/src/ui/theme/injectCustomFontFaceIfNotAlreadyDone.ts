import { env } from "env";
import { assert, type Equals, is } from "tsafe/assert";
import { exclude } from "tsafe/exclude";

export function injectCustomFontFaceIfNotAlreadyDone(): void {
    const { fontFamily, dirUrl } = env.FONT;

    skip_if_already_done: {
        const metaTag = document.querySelector(`meta[name='onyxia-font']`);

        if (metaTag === null) {
            break skip_if_already_done;
        }

        assert(is<HTMLMetaElement>(metaTag));

        if (metaTag.content !== fontFamily) {
            break skip_if_already_done;
        }

        // NOTE: We already have the correct font face.
        return;
    }

    const styleElement = document.createElement("style");

    const fontFaceRules = ([400, 500, 600, 700] as const)
        .map(weight => ({
            weight,
            normalFontFileBasename: env.FONT[weight],
            italicFontFileBasename: env.FONT[`${weight}-italic`]
        }))
        .map(({ weight, normalFontFileBasename, italicFontFileBasename }) =>
            (["normal", "italic"] as const)
                .map(fontStyle => ({
                    fontStyle,
                    fontFileBasename: (() => {
                        switch (fontStyle) {
                            case "normal":
                                return normalFontFileBasename;
                            case "italic":
                                return italicFontFileBasename;
                        }
                        assert<Equals<typeof fontStyle, never>>();
                    })()
                }))
                .map(({ fontStyle, fontFileBasename }) =>
                    fontFileBasename === undefined
                        ? undefined
                        : {
                              fontStyle,
                              fontFileBasename
                          }
                )
                .filter(exclude(undefined))
                .map(({ fontFileBasename, ...rest }) => ({
                    fontFileBasename,
                    ...rest,
                    format: fontFileBasename.split(".").pop()
                }))
                .map(({ fontStyle, fontFileBasename, format }) =>
                    [
                        `@font-face {`,
                        `    font-family: '${fontFamily}';`,
                        `    font-style: ${fontStyle};`,
                        `    font-weight: ${weight};`,
                        `    font-display: swap;`,
                        `    src: url('${dirUrl}/${fontFileBasename}') format('${format}');`,
                        `}`
                    ].join("\n")
                )
                .join("\n")
        )
        .join("\n");

    styleElement.appendChild(document.createTextNode(fontFaceRules));

    document.head.appendChild(styleElement);
}
