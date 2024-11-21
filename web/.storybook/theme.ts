import { create } from "@storybook/theming";

export const darkTheme = create({
    base: "dark",
    appBg: "#2c323f",
    appContentBg: "#2c323f",
    appPreviewBg: "#2c323f",
    barBg: "#2c323f",
    colorSecondary: "#ff562c",
    textColor: "#f1f0eb",
    brandImage: "onyxiaLogo.png",
    brandTitle: "Onyxia UI",
    brandUrl: "https://github.com/InseeFrLab/onyxia-ui",
    fontBase: '"Work Sans","Open Sans", sans-serif',
    fontCode: "monospace"
});

export const lightTheme = create({
    base: "light",
    appBg: "#f1f0eb",
    appContentBg: "#f1f0eb",
    appPreviewBg: "#f1f0eb",
    barBg: "#f1f0eb",
    colorSecondary: "#ff562c",
    textColor: "#2c323f",
    textInverseColor: "#f1f0eb",
    brandImage: "onyxiaLogo.png",
    brandTitle: "Onyxia UI",
    brandUrl: "https://github.com/InseeFrLab/onyxia-ui",
    fontBase: '"Work Sans","Open Sans", sans-serif',
    fontCode: "monospace"
});
