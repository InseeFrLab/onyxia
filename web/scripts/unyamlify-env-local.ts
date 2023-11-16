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
                `      ONYXIA_API_URL: https://datalab.sspcloud.fr/api`,
                `      HEADER_TEXT_BOLD: SSP Cloud`,
                `      HEADER_TEXT_FOCUS: Datalab`,
                `      TERMS_OF_SERVICES: |`,
                `        // This is JSON5, a more permissive JSON syntax, see https://json5.org/`,
                `        { `,
                `          en: "https://www.sspcloud.fr/tos_en.md",`,
                `          fr: "https://www.sspcloud.fr/tos_fr.md",`,
                `        }`,
                `      HEADER_LINKS: |`,
                `        [`,
                `          {`,
                `            label: {`,
                `              en: "Tutorials",`,
                `              fr: "Tutoriels",`,
                `            },`,
                `            icon: "https://www.sspcloud.fr/trainings.svg",`,
                `            url: "https://www.sspcloud.fr/formation"`,
                `          }`,
                `        ]`,
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
