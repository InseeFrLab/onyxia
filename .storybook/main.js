

module.exports = {
  "stories": [
    "../src/stories/**/*.stories.mdx",
    "../src/stories/**/*.stories.@(ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app"
  ],
  // https://github.com/storybookjs/storybook/issues/4672#issuecomment-512817364
  "loader": require.resolve("babel-loader", { "paths": ["node_modules/react-scripts"] }),
};