process.env.NODE_ENV = "production";

const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const webpackConfigProd = require("react-scripts/config/webpack.config")(
  "production"
);
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

//Add plugins

// Remove all files inside webpack's output.path directory,
webpackConfigProd.plugins.push(new CleanWebpackPlugin());

// webpack-bundle-analyzer
webpackConfigProd.plugins.push(
  new BundleAnalyzerPlugin({
    analyzerMode: "static",
    reportFilename: "../bundle-report/webpack-bundle-analyzer.html",
    defaultSizes: "parsed",
    openAnalyzer: false
  })
);

// Custom progress bar
const chalk = require("chalk");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");
const magenta = text => {
  return chalk.magenta.bold(text);
};
webpackConfigProd.plugins.push(
  new ProgressBarPlugin({
    format: `${magenta("analyzing...")} ${magenta("[:bar]")}${magenta(
      "[:percent]"
    )}${magenta("[:elapsed seconds]")} - :msg`
  })
);

// actually running compilation and waiting for plugin to start explorer
webpack(webpackConfigProd, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err);
  }
});
