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
import * as fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
    "plugins": [
        react(),
        tsconfigPaths(),
        commonjs(),
        keycloakify(),
        viteEnvs({
            computedEnv: () => ({
                "WEB_VERSION": JSON.parse(
                    fs.readFileSync(pathJoin(__dirname, "package.json")).toString("utf8")
                ).version
            })
        })
    ]
});
