import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tssUnusedClasses from "eslint-plugin-tss-unused-classes";
import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
    {
        ignores: ["dist", "!.storybook"]
    },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
            "tss-unused-classes": tssUnusedClasses
        },
        rules: {
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true }
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
        }
    },
    ...storybook.configs["flat/recommended"],
    eslintConfigPrettier
);
