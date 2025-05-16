import { fileURLToPath } from "url";
import * as yaml from "yaml";
import { join as pathJoin, basename as pathBasename, dirname as pathDirname } from "path";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

const projectRootPath = pathJoin(__dirname, "..");
// Convert import.meta.url to a file path

const envLocalYamlFilePath = pathJoin(projectRootPath, ".env.local.yaml");

if (!fs.existsSync(envLocalYamlFilePath)) {
    fs.writeFileSync(
        envLocalYamlFilePath,
        Buffer.from(
            [
                `# You can edit this file to test the web app in different configuration locally`,
                `# After editing this file you must re-run: \`yarn dev\``,
                ``,
                `onyxia:`,
                `  web:`,
                `    env:`,
                `      #CUSTOM_RESOURCES: "https://example.com/onyxia-resources.zip"`,
                `      ONYXIA_API_URL: https://datalab.sspcloud.fr/api`,
                `      HEADER_TEXT_BOLD: My Organization`,
                `      HEADER_TEXT_FOCUS: Datalab`,
                `      HEADER_LINKS: |`,
                `        [`,
                `          {`,
                `            label: {`,
                `              en: "Tutorials",`,
                `              fr: "Tutoriels",`,
                `            },`,
                `            icon: "School",`,
                `            url: "https://www.sspcloud.fr/formation"`,
                `          }`,
                `        ]`,
                `      #PALETTE_OVERRIDE: |`,
                `      #  {`,
                `      #    focus: {`,
                `      #      main: "#FF9100", // Light mode focus`,
                `      #      light: "#FAB900", // Dark mode focus`,
                `      #    },`,
                `      #    limeGreen: {`,
                `      #        main: "#00DF0A"`,
                `      #    }`,
                `      #  }`,
                `      #GLOBAL_ALERT: |`,
                `      #  {`,
                `      #    severity: "success",`,
                `      #    message: {`,
                `      #      en: "Hello!  \\n\\`,
                `      #        This is a global alert message.\\`,
                `      #        It Supports **Mardown**. You can include [links](https://example.com).",`,
                `      #      en: "Bonjour!  \\n\\`,
                `      #        Ceci est un message d'alerte global.\\`,
                `      #        Il supporte **Markdown**. Vous pouvez inclure [des liens](https://example.com)."`,
                `      #    }`,
                `      #  }`,
                `      #CUSTOM_HTML_HEAD: |`,
                `      #    <script src="%PUBLIC_URL%/custom-resources/my-plugin.js"></script>`,
                ``
            ].join("\n"),
            "utf8"
        )
    );
}

const parsedEnvLocalYaml: { onyxia: { web: { env: Record<string, string> } } } =
    yaml.parse(fs.readFileSync(envLocalYamlFilePath).toString("utf8"));

fs.writeFileSync(
    pathJoin(projectRootPath, ".env.local"),
    Buffer.from(
        [
            `# This file was generated automatically from ${pathBasename(
                envLocalYamlFilePath
            )}`,
            `# Do not edit it manually!`,
            "",
            ...Object.entries(parsedEnvLocalYaml.onyxia.web.env).map(([key, value]) =>
                value === ""
                    ? `${key}=""`
                    : `${key}="vite-envs:b64Decode(${Buffer.from(`${value}`, "utf8").toString("base64")})"`
            )
        ].join("\n"),
        "utf8"
    )
);
