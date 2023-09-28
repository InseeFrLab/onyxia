/*
We use this file to in order to be able to use webpack plugin without
ejecting from CRA.
This file is picked up by react-app-rewired that we use in place or react-scripts
*/

// This is an webpack extension to detect circular import (example:  A imports B that imports A)
const CircularDependencyPlugin = require("circular-dependency-plugin");
const { DefinePlugin, ProvidePlugin } = require("webpack");

module.exports = function override(config) {
    if (!config.resolve.fallback) {
        config.resolve.fallback = {};
    }

    config.resolve.fallback["crypto"] = require.resolve("crypto-browserify");
    config.resolve.fallback["stream"] = require.resolve("stream-browserify");
    config.resolve.fallback["http"] = require.resolve("stream-http");
    config.resolve.fallback["https"] = require.resolve("https-browserify");
    config.resolve.fallback["timers"] = require.resolve("timers-browserify");
    config.resolve.fallback["path"] = require.resolve("path-browserify");

    if (!config.plugins) {
        config.plugins = [];
    }

    config.plugins.push(
        ...[
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
                // This let us display the version number in the footer of the app.
                "process.env.CHART_VERSION": JSON.stringify((()=>{

                    const { CHART_VERSION } = process.env;

                    console.log(CHART_VERSION);

                    if( CHART_VERSION === undefined ){
                        return "";
                    }

                    return CHART_VERSION;


                })())
            }),
        ],
    );

    return config;
};
