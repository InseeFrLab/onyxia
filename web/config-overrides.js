/*
We use this file to in order to be able to use webpack plugin without
ejecting from CRA.
This file is picked up by react-app-rewired that we use in place or react-scripts
*/

// This is an webpack extension to detect circular import (example:  A imports B that imports A)
const CircularDependencyPlugin = require("circular-dependency-plugin");
const { DefinePlugin, ProvidePlugin } = require("webpack");
const { assert } = require("tsafe/assert");

module.exports = function override(config) {

    Object.assign(config.resolve.fallback ??= {}, {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "timers": require.resolve("timers-browserify"),
        "path": require.resolve("path-browserify")
    });

    (config.plugins ??= []).push(...[
        new CircularDependencyPlugin({
            // exclude detection of files based on a RegExp
            "exclude": /node_modules/,
            // add errors to webpack instead of warnings
            "failOnError": true,
            // allow import cycles that include an asynchronous import,
            // e.g. via import(/* webpackMode: "weak" */ './file.js')
            "allowAsyncCycles": false,
            // set the current working directory for displaying module paths
            "cwd": process.cwd(),
        }),
        new ProvidePlugin({
            "process": "process",
        }),
        new DefinePlugin({
            "process.env.WEB_VERSION": JSON.stringify(process.env.npm_package_version)
        })
    ]);

    {

        const sourceMapLoaderRule = config.module.rules.find(({ loader }) => loader.includes("source-map-loader"));

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
};
