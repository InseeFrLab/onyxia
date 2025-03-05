import type { StorybookConfig } from "@storybook/react-vite";

export default {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

    addons: [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "storybook-dark-mode",
        "@storybook/addon-interactions",
        "@storybook/addon-themes",
        "@storybook/addon-a11y"
    ],

    framework: {
        name: "@storybook/react-vite",
        options: {}
    },

    staticDirs: ["./static", "../public"]
} as StorybookConfig;
