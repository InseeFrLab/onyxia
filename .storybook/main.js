
module.exports = {
  "staticDirs": [
    "../public"
  ],
  "stories": [
    "../src/stories/**/*.stories.mdx",
    "../src/stories/**/*.stories.@(ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
    "@storybook/addon-events"
  ],
  "core": { 
    "builder": "webpack5" 
  }
};