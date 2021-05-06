// This is an webpack extension to detect circular import (example:  A imports B that imports A)

const CircularDependencyPlugin = require("circular-dependency-plugin");
const { DefinePlugin } = require("webpack");


module.exports = function override(config) {

    if (!config.plugins) {
        config.plugins = [];
    }

    config.plugins.push(...[
        new CircularDependencyPlugin({
            // exclude detection of files based on a RegExp
            "exclude": /node_modules/,
            // add errors to webpack instead of warnings
            "failOnError": true,
            // allow import cycles that include an asynchronous import,
            // e.g. via import(/* webpackMode: "weak" */ './file.js')
            "allowAsyncCycles": false,
            // set the current working directory for displaying module paths
            "cwd": process.cwd()
        }),
        new DefinePlugin({
            "process.env.VERSION": JSON.stringify(process.env.npm_package_version)
        })
    ]);

    return config;

};

