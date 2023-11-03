import { FONT } from "./envCarriedOverToKc";
import { assert, type Equals } from "tsafe/assert";
import { exclude } from "tsafe/exclude";

export function injectCustomFontFace(): void {
    const { fontFamily, dirUrl } = FONT;

    if (fontFamily === "Work Sans") {
        return;
    }

    const styleElement = document.createElement("style");

    const fontFaceRules = ([400, 500, 600, 700] as const)
        .map(weight => ({
            weight,
            "normalFontFileBasename": FONT[weight],
            "italicFontFileBasename": FONT[`${weight}-italic`]
        }))
        .map(({ weight, normalFontFileBasename, italicFontFileBasename }) =>
            (["normal", "italic"] as const)
                .map(fontStyle => ({
                    fontStyle,
                    "fontFileBasename": (() => {
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
                    "format": fontFileBasename.split(".").pop()
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
