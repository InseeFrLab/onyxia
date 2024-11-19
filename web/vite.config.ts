import { defineConfig } from "vite";
// This enables absolute imports like `import { tss } from "tss";`
// instead of `import { tss } from "../../tss";`
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
// NOTE: This is just for the Keycloakify core contributors to be able to dynamically link
// to a local version of the keycloakify package. This is not needed for normal usage.
import commonjs from "vite-plugin-commonjs";
import { keycloakify } from "keycloakify/vite-plugin";
import { viteEnvs } from "vite-envs";
import { join as pathJoin } from "path";
import * as fs from "fs/promises";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths(),
        commonjs(),
        keycloakify({
            themeName: "onyxia",
            accountThemeImplementation: "none",
            themeVersion: process.env.KEYCLOAKIFY_THEME_VERSION ?? "0.0.0",
            keycloakVersionTargets: {
                "22-to-25": "keycloak-theme-for-kc-22-to-25.jar",
                "all-other-versions": "keycloak-theme.jar"
            },
            environmentVariables: [
                {
                    name: "ONYXIA_RESOURCES_ALLOWED_ORIGINS",
                    default: "*"
                },
                {
                    name: "ONYXIA_HEADER_TEXT_BOLD",
                    default: ""
                },
                {
                    name: "ONYXIA_HEADER_TEXT_FOCUS",
                    default: ""
                },
                {
                    name: "ONYXIA_PALETTE_OVERRIDE",
                    default: ""
                },
                {
                    name: "ONYXIA_TAB_TITLE",
                    default: "Onyxia"
                }
            ],
            postBuild: async () => {
                await fs.rm(
                    pathJoin(
                        "theme",
                        "onyxia",
                        "login",
                        "resources",
                        "dist",
                        "mui-icons-material"
                    ),
                    { recursive: true }
                );
            }
        }),
        viteEnvs({
            computedEnv: async ({ resolvedConfig }) => ({
                WEB_VERSION: JSON.parse(
                    (await fs.readFile(pathJoin(__dirname, "package.json"))).toString(
                        "utf8"
                    )
                ).version,
                // Only so that html substitution can work (after rendering of the EJS).
                // Do not use in the TS code.
                PUBLIC_URL: (() => {
                    const { BASE_URL } = resolvedConfig.env;

                    return BASE_URL === "/" ? "" : BASE_URL.replace(/\/$/, "");
                })()
            }),
            indexAsEjs: true
        })
    ],
    build: {
        sourcemap: true,
        minify: false
    }
});
