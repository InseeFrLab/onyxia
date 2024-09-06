import type { StorybookConfig } from "@storybook/react-vite";

export default {
    "stories": ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    "addons": [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "storybook-dark-mode",
        "@storybook/addon-interactions",
        "@storybook/addon-themes"
    ],
    "framework": {
        "name": "@storybook/react-vite",
        "options": {}
    },
    "core": {
        "builder": "@storybook/builder-vite"
    },
    "staticDirs": ["./static", "../public"],
    managerHead: head => {
        return `
    ${head}
        <meta name="onyxia-font" content="Work Sans">
  `;
    }
} as StorybookConfig;
