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
                `      AI: |`,
                `        {`,
                `          disable: false,`,
                `          disallowUserToAddProviders: false,`,
                `          description: {`,
                `            en: "Use the models of your organization in your services. [Read more about this feature](https://www.sspcloud.fr/document?path=SSPCloud%E2%90%A3Documentation%E2%80%BAUsing%E2%90%A3the%E2%90%A3Datalab%E2%80%BAUsing%E2%90%A3AI%E2%90%A3models%E2%90%A3in%E2%90%A3the%E2%90%A3Datalab)",`,
                `            fr: "Utilisez les modèles de votre organisation dans vos services. [En savoir plus sur cette fonctionnalité](https://www.sspcloud.fr/document?path=SSPCloud%E2%90%A3Documentation%E2%80%BAUsing%E2%90%A3the%E2%90%A3Datalab%E2%80%BAUsing%E2%90%A3AI%E2%90%A3models%E2%90%A3in%E2%90%A3the%E2%90%A3Datalab)"`,
                `          },`,
                `          providers: [`,
                `            {`,
                `              name: "SSPCloud LLM",`,
                `              providerType: "openai-compatible",`,
                `              apiBase: "https://llm.lab.sspcloud.fr/api",`,
                `              authentification: {`,
                `                type: "api-key",`,
                `                obtentionMethod: "open-webui-oidc-token-exchange",`,
                `                oidcConfiguration: {`,
                `                    clientID: "onyxia_openwebui"`,
                `                }`,
                `              },`,
                `              logoUrl: "https://minio.lab.sspcloud.fr/projet-onyxia/assets/AI/openwebui.png",`,
                `              documentation: {`,
                `                mainText: {`,
                `                  en: "SSPCloud LLM uses Open WebUI to give you access to AI models and its OpenAI-compatible API.",`,
                `                  fr: "SSPCloud LLM utilise Open WebUI pour vous donner accès à des modèles d'IA et à son API compatible OpenAI."`,
                `                },`,
                `                links: [`,
                `                  {`,
                `                    label: { en: "API documentation", fr: "Documentation de l'API" },`,
                `                    url: "https://docs.openwebui.com/reference/api-endpoints/"`,
                `                  },`,
                `                  {`,
                `                    label: { en: "Models documentation", fr: "Documentation des modèles" },`,
                `                    url: "https://llm.lab.sspcloud.fr/workspace/models"`,
                `                  },`,
                `                  {`,
                `                    label: { en: "Models configuration (vLLM)", fr: "Configuration des modèles (vLLM)" },`,
                `                    url: "https://github.com/InseeFrLab/sspcloud-llm"`,
                `                  }`,
                `                ]`,
                `              }`,
                `            },`,
                `            {`,
                `              name: "Mistral",`,
                `              providerType: "mistral",`,
                `              apiBase: "https://api.mistral.ai/v1",`,
                `              logoUrl: "https://minio.lab.sspcloud.fr/projet-onyxia/assets/AI/mistral.svg",`,
                `              documentation: {`,
                `                mainText: {`,
                `                  fr: "Saisissez votre clé API Mistral pour récupérer les modèles disponibles.",`,
                `                  en: "Enter your Mistral API key to retrieve available models."`,
                `                }`,
                `              },`,
                `              authentification: {`,
                `                type: "api-key",`,
                `                obtentionMethod: "user-provided"`,
                `              }`,
                `            }`,
                `          ],`,
                `        }`,
                `      S3: |`,
                `        {`,
                `          URL: "https://minio.lab.sspcloud.fr",`,
                `          region: "us-east-1",`,
                `          pathStyleAccess: true,`,
                `          sts: {`,
                `            durationSeconds: 604800,`,
                `            oidcConfiguration: {`,
                `              clientID: "onyxia_minio"`,
                `            },`,
                `            role: {`,
                `              profileName: "default",`,
                `              roleARN: "",`,
                `              roleSessionName: ""`,
                `            }`,
                `          },`,
                `          anonymousProfileName: "anonymous",`,
                `          bookmarks: [`,
                `            {`,
                `              s3Uri: "s3://$1/",`,
                `              title: "Personal Bucket",`,
                `              claimName: "preferred_username",`,
                `              forProfileName: "default"`,
                `            },`,
                `            {`,
                `              s3Uri: "s3://projet-$1/",`,
                `              title: "Projet $1",`,
                `              claimName: "groups",`,
                `              excludedClaimPattern: "^USER_ONYXIA.*",`,
                `              forProfileName: "default"`,
                `            },`,
                `            {`,
                `              s3Uri: "s3://donnees-insee/diffusion/",`,
                `              title: {`,
                `                fr: "Données de diffusion",`,
                `                en: "Dissemination Data"`,
                `              },`,
                `              forProfileName: "default"`,
                `            }`,
                `          ]`,
                `        }`,
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
