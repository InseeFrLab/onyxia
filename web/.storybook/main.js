const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const { DefinePlugin } = require("webpack");
const { assert } = require("tsafe/assert");

const craProjectRootDirPath = path.join(__dirname, "..");

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
  "webpackFinal": (config) => {

    if (config.resolve === undefined) {
      config.resolve = {};
    }

    config.resolve.modules = [path.resolve("./src"), ...config.resolve.modules];

    Object.assign(config.resolve.fallback ??= {}, {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "timers": require.resolve("timers-browserify"),
      "path": require.resolve("path-browserify")
    });

    (config.plugins ??= []).push(...[
      new DefinePlugin({
        "window.__cra-envs-json__": (() => {


          const loadEnvConfig = (envPath) => {
            if (fs.existsSync(envPath)) {
              const envConfig = dotenv.parse(fs.readFileSync(envPath));
              return envConfig;
            }
            return {};
          };

          const env = Object.fromEntries(
            Object.entries({
              ...loadEnvConfig(path.join(craProjectRootDirPath, ".env")),
              ...loadEnvConfig(path.join(craProjectRootDirPath, ".env.local")),
            })
              .map(([key, value]) => [key.replace(/^REACT_APP_/, ""), value])
          );


          return JSON.stringify(JSON.stringify(env));

        })()
      })
    ]);


    {

      const sourceMapLoaderRule = config.module.rules.find(({ loader }) => typeof loader === "string" && loader.includes("source-map-loader"));

      assert(sourceMapLoaderRule !== undefined);

      sourceMapLoaderRule.test = /((?<!\.worker)\.(js|mjs))|(\.(jsx|ts|tsx|css))$/;

    }

    config.module.rules.push(...[
      {
        "test": /\.worker\.js$/i,
        "type": "asset/resource",
        "generator": {
          "filename": "static/js/[name].[hash:8][ext]",
        }
      }
    ]);

    return config;


  }
};