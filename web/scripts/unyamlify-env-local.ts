import * as yaml from "yaml";
import { join as pathJoin, basename as pathBasename } from "path";
import * as fs from "fs";

const projectRootPath = pathJoin(__dirname, "..");

const envLocalYamlFilePath = pathJoin(projectRootPath, ".env.local.yaml");

if (!fs.existsSync(envLocalYamlFilePath)) {
    fs.writeFileSync(
        envLocalYamlFilePath,
        Buffer.from(
            [
                `# You can edit this file to test the web app in different configuration locally`,
                `# After editing this file you must re-run: yarn start`,
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
                `      CUSTOM_HTML_HEAD: |`,
                `          <script src="%PUBLIC_URL%/custom-resources/my-plugin.js"></script>`,
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
            ...Object.entries(parsedEnvLocalYaml.onyxia.web.env).map(
                ([key, value]) => `REACT_APP_${key}="${value.replace(/\n/g, "\\n")}"`
            )
        ].join("\n"),
        "utf8"
    )
);
