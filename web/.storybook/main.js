const path = require("path");

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
  },
  "webpackFinal": config => ({
    ...config,
    "resolve": {
      ...config.resolve,
      "modules": [path.resolve("./src"), ...config.resolve.modules],
      "fallback": {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "timers": require.resolve("timers-browserify"),
        "path": require.resolve("path-browserify"),
        ...config.resolve.fallback,
      }
    }
  })
};