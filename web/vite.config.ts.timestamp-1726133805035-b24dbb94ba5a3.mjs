// vite.config.ts
import { defineConfig } from "file:///Users/joseph/github/onyxia/web/node_modules/vite/dist/node/index.js";
import tsconfigPaths from "file:///Users/joseph/github/onyxia/web/node_modules/vite-tsconfig-paths/dist/index.mjs";
import react from "file:///Users/joseph/github/onyxia/web/node_modules/@vitejs/plugin-react/dist/index.mjs";
import commonjs from "file:///Users/joseph/github/onyxia/web/node_modules/vite-plugin-commonjs/dist/index.mjs";
import { keycloakify } from "file:///Users/joseph/github/onyxia/web/node_modules/keycloakify/vite-plugin/index.js";
import { viteEnvs } from "file:///Users/joseph/github/onyxia/web/node_modules/vite-envs/index.js";
import { join as pathJoin } from "path";
import * as fs from "fs/promises";
var __vite_injected_original_dirname = "/Users/joseph/github/onyxia/web";
var vite_config_default = defineConfig({
  "plugins": [
    react(),
    tsconfigPaths(),
    commonjs(),
    keycloakify({
      "themeName": "onyxia",
      "environmentVariables": [
        {
          "name": "ONYXIA_RESOURCES_ALLOWED_ORIGINS",
          "default": "*"
        },
        {
          "name": "ONYXIA_HEADER_TEXT_BOLD",
          "default": ""
        },
        {
          "name": "ONYXIA_HEADER_TEXT_FOCUS",
          "default": ""
        },
        {
          "name": "ONYXIA_PALETTE_OVERRIDE",
          "default": ""
        },
        {
          "name": "ONYXIA_TAB_TITLE",
          "default": "Onyxia"
        }
      ],
      "postBuild": async () => {
        await fs.rm(
          pathJoin(
            "theme",
            "onyxia",
            "login",
            "resources",
            "build",
            "material-icons"
          ),
          { "recursive": true }
        );
      }
    }),
    viteEnvs({
      "computedEnv": async ({ resolvedConfig }) => ({
        "WEB_VERSION": JSON.parse(
          (await fs.readFile(pathJoin(__vite_injected_original_dirname, "package.json"))).toString(
            "utf8"
          )
        ).version,
        // Only so that html substitution can work (after rendering of the EJS).
        // Do not use in the TS code.
        "PUBLIC_URL": (() => {
          const { BASE_URL } = resolvedConfig.env;
          return BASE_URL === "/" ? "" : BASE_URL.replace(/\/$/, "");
        })()
      }),
      "indexAsEjs": true
    })
  ],
  "build": {
    "sourcemap": true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvam9zZXBoL2dpdGh1Yi9vbnl4aWEvd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvam9zZXBoL2dpdGh1Yi9vbnl4aWEvd2ViL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9qb3NlcGgvZ2l0aHViL29ueXhpYS93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuLy8gVGhpcyBlbmFibGVzIGFic29sdXRlIGltcG9ydHMgbGlrZSBgaW1wb3J0IHsgdHNzIH0gZnJvbSBcInRzc1wiO2Bcbi8vIGluc3RlYWQgb2YgYGltcG9ydCB7IHRzcyB9IGZyb20gXCIuLi8uLi90c3NcIjtgXG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuLy8gTk9URTogVGhpcyBpcyBqdXN0IGZvciB0aGUgS2V5Y2xvYWtpZnkgY29yZSBjb250cmlidXRvcnMgdG8gYmUgYWJsZSB0byBkeW5hbWljYWxseSBsaW5rXG4vLyB0byBhIGxvY2FsIHZlcnNpb24gb2YgdGhlIGtleWNsb2FraWZ5IHBhY2thZ2UuIFRoaXMgaXMgbm90IG5lZWRlZCBmb3Igbm9ybWFsIHVzYWdlLlxuaW1wb3J0IGNvbW1vbmpzIGZyb20gXCJ2aXRlLXBsdWdpbi1jb21tb25qc1wiO1xuaW1wb3J0IHsga2V5Y2xvYWtpZnkgfSBmcm9tIFwia2V5Y2xvYWtpZnkvdml0ZS1wbHVnaW5cIjtcbmltcG9ydCB7IHZpdGVFbnZzIH0gZnJvbSBcInZpdGUtZW52c1wiO1xuaW1wb3J0IHsgam9pbiBhcyBwYXRoSm9pbiB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgXCJwbHVnaW5zXCI6IFtcbiAgICAgICAgcmVhY3QoKSxcbiAgICAgICAgdHNjb25maWdQYXRocygpLFxuICAgICAgICBjb21tb25qcygpLFxuICAgICAgICBrZXljbG9ha2lmeSh7XG4gICAgICAgICAgICBcInRoZW1lTmFtZVwiOiBcIm9ueXhpYVwiLFxuICAgICAgICAgICAgXCJlbnZpcm9ubWVudFZhcmlhYmxlc1wiOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJPTllYSUFfUkVTT1VSQ0VTX0FMTE9XRURfT1JJR0lOU1wiLFxuICAgICAgICAgICAgICAgICAgICBcImRlZmF1bHRcIjogXCIqXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiT05ZWElBX0hFQURFUl9URVhUX0JPTERcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkZWZhdWx0XCI6IFwiXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiT05ZWElBX0hFQURFUl9URVhUX0ZPQ1VTXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGVmYXVsdFwiOiBcIlwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIk9OWVhJQV9QQUxFVFRFX09WRVJSSURFXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGVmYXVsdFwiOiBcIlwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIk9OWVhJQV9UQUJfVElUTEVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkZWZhdWx0XCI6IFwiT255eGlhXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgXCJwb3N0QnVpbGRcIjogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzLnJtKFxuICAgICAgICAgICAgICAgICAgICBwYXRoSm9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGhlbWVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwib255eGlhXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ2luXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlc291cmNlc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJidWlsZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJtYXRlcmlhbC1pY29uc1wiXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgIHsgXCJyZWN1cnNpdmVcIjogdHJ1ZSB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgICAgIHZpdGVFbnZzKHtcbiAgICAgICAgICAgIFwiY29tcHV0ZWRFbnZcIjogYXN5bmMgKHsgcmVzb2x2ZWRDb25maWcgfSkgPT4gKHtcbiAgICAgICAgICAgICAgICBcIldFQl9WRVJTSU9OXCI6IEpTT04ucGFyc2UoXG4gICAgICAgICAgICAgICAgICAgIChhd2FpdCBmcy5yZWFkRmlsZShwYXRoSm9pbihfX2Rpcm5hbWUsIFwicGFja2FnZS5qc29uXCIpKSkudG9TdHJpbmcoXG4gICAgICAgICAgICAgICAgICAgICAgICBcInV0ZjhcIlxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIC8vIE9ubHkgc28gdGhhdCBodG1sIHN1YnN0aXR1dGlvbiBjYW4gd29yayAoYWZ0ZXIgcmVuZGVyaW5nIG9mIHRoZSBFSlMpLlxuICAgICAgICAgICAgICAgIC8vIERvIG5vdCB1c2UgaW4gdGhlIFRTIGNvZGUuXG4gICAgICAgICAgICAgICAgXCJQVUJMSUNfVVJMXCI6ICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgQkFTRV9VUkwgfSA9IHJlc29sdmVkQ29uZmlnLmVudjtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQkFTRV9VUkwgPT09IFwiL1wiID8gXCJcIiA6IEJBU0VfVVJMLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcbiAgICAgICAgICAgICAgICB9KSgpXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIFwiaW5kZXhBc0Vqc1wiOiB0cnVlXG4gICAgICAgIH0pXG4gICAgXSxcbiAgICBcImJ1aWxkXCI6IHtcbiAgICAgICAgXCJzb3VyY2VtYXBcIjogdHJ1ZVxuICAgIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErUSxTQUFTLG9CQUFvQjtBQUc1UyxPQUFPLG1CQUFtQjtBQUMxQixPQUFPLFdBQVc7QUFHbEIsT0FBTyxjQUFjO0FBQ3JCLFNBQVMsbUJBQW1CO0FBQzVCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsUUFBUSxnQkFBZ0I7QUFDakMsWUFBWSxRQUFRO0FBWHBCLElBQU0sbUNBQW1DO0FBY3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLFdBQVc7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLFNBQVM7QUFBQSxJQUNULFlBQVk7QUFBQSxNQUNSLGFBQWE7QUFBQSxNQUNiLHdCQUF3QjtBQUFBLFFBQ3BCO0FBQUEsVUFDSSxRQUFRO0FBQUEsVUFDUixXQUFXO0FBQUEsUUFDZjtBQUFBLFFBQ0E7QUFBQSxVQUNJLFFBQVE7QUFBQSxVQUNSLFdBQVc7QUFBQSxRQUNmO0FBQUEsUUFDQTtBQUFBLFVBQ0ksUUFBUTtBQUFBLFVBQ1IsV0FBVztBQUFBLFFBQ2Y7QUFBQSxRQUNBO0FBQUEsVUFDSSxRQUFRO0FBQUEsVUFDUixXQUFXO0FBQUEsUUFDZjtBQUFBLFFBQ0E7QUFBQSxVQUNJLFFBQVE7QUFBQSxVQUNSLFdBQVc7QUFBQSxRQUNmO0FBQUEsTUFDSjtBQUFBLE1BQ0EsYUFBYSxZQUFZO0FBQ3JCLGNBQVM7QUFBQSxVQUNMO0FBQUEsWUFDSTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDSjtBQUFBLFVBQ0EsRUFBRSxhQUFhLEtBQUs7QUFBQSxRQUN4QjtBQUFBLE1BQ0o7QUFBQSxJQUNKLENBQUM7QUFBQSxJQUNELFNBQVM7QUFBQSxNQUNMLGVBQWUsT0FBTyxFQUFFLGVBQWUsT0FBTztBQUFBLFFBQzFDLGVBQWUsS0FBSztBQUFBLFdBQ2YsTUFBUyxZQUFTLFNBQVMsa0NBQVcsY0FBYyxDQUFDLEdBQUc7QUFBQSxZQUNyRDtBQUFBLFVBQ0o7QUFBQSxRQUNKLEVBQUU7QUFBQTtBQUFBO0FBQUEsUUFHRixlQUFlLE1BQU07QUFDakIsZ0JBQU0sRUFBRSxTQUFTLElBQUksZUFBZTtBQUVwQyxpQkFBTyxhQUFhLE1BQU0sS0FBSyxTQUFTLFFBQVEsT0FBTyxFQUFFO0FBQUEsUUFDN0QsR0FBRztBQUFBLE1BQ1A7QUFBQSxNQUNBLGNBQWM7QUFBQSxJQUNsQixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ0wsYUFBYTtBQUFBLEVBQ2pCO0FBQ0osQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
