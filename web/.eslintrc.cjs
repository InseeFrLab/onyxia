module.exports = {
    "root": true,
    "env": { "browser": true, "es2020": true },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react-hooks/recommended",
        "plugin:storybook/recommended",
        "prettier"
    ],
    "ignorePatterns": ["dist", ".eslintrc.cjs"],
    "parser": "@typescript-eslint/parser",
    "plugins": [
        "react-refresh",
        "tss-unused-classes"
    ],
    "rules": {
        "react-refresh/only-export-components": [
            "warn",
            { "allowConstantExport": true }
        ],
        "react-hooks/exhaustive-deps": "off",
        "@typescript-eslint/no-redeclare": "off",
        "no-labels": "off",
        "react-hooks/rules-of-hooks": "warn",
        "prefer-const": "off",
        "no-sequences": "off",
        "tss-unused-classes/unused-classes": "warn",
        "no-lone-blocks": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "no-constant-condition": "off",
        "@typescript-eslint/no-namespace": "off",
        "no-empty": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/ban-types": "off"
    },
    "overrides": [
        {
            "files": ["**/*.stories.*"],
            "rules": {
                "import/no-anonymous-default-export": "off"
            },
        },
    ],
};
