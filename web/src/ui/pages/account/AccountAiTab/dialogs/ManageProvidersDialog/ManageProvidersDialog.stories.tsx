import type { Meta, StoryObj } from "@storybook/react";
import { ManageProvidersDialog } from "./ManageProvidersDialog";

const meta = {
    title: "Pages/Account/IA/ManageProvidersDialog",
    component: ManageProvidersDialog,
    parameters: {
        layout: "fullscreen"
    },
    args: {
        initialProviderName: "SSP Cloud LLM",
        providers: [
            {
                name: "SSP Cloud LLM",
                subtitle: "Provided by your organization",
                apiBase: "https://llm.example.test/api",
                apiKey: "storybook-api-key",
                isApiKeyEditable: false,
                availableModels: [
                    "gemma4-26b-moe",
                    "qwen3-6-35b-moe",
                    "llama-3.3-70b",
                    "mistral-small"
                ],
                selectedModelIds: ["gemma4-26b-moe", "qwen3-6-35b-moe"],
                isModelSelectionDisabled: false,
                connectionError: undefined,
                canRefreshCredentials: true,
                isRefreshingCredentials: false,
                canEdit: false,
                canDelete: false,
                documentation: {
                    mainText: {
                        en: "SSPCloud LLM uses Open WebUI to give you access to AI models and its OpenAI-compatible API.",
                        fr: "SSPCloud LLM utilise Open WebUI pour vous donner accès à des modèles d'IA et à son API compatible OpenAI."
                    },
                    links: [
                        {
                            label: {
                                en: "Provider documentation",
                                fr: "Documentation du provider"
                            },
                            url: "https://docs.sspcloud.fr"
                        },
                        {
                            label: {
                                en: "API documentation",
                                fr: "Documentation de l'API"
                            },
                            url: "https://docs.openwebui.com/getting-started/api-endpoints"
                        },
                        {
                            label: {
                                en: "Models documentation",
                                fr: "Documentation des modèles"
                            },
                            url: "https://llm.lab.sspcloud.fr"
                        }
                    ]
                }
            }
        ],
        onClose: () => {},
        onRefreshCredentials: () => {},
        onTestConnection: () => {},
        onEdit: () => {},
        onDelete: () => {},
        onSaveModels: () => {},
        onSaveApiKey: () => {}
    }
} satisfies Meta<typeof ManageProvidersDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EditableCredentials: Story = {
    args: {
        providers: [
            {
                ...meta.args.providers[0],
                name: "OpenAI",
                subtitle: "Custom AI providers",
                apiKey: "",
                isApiKeyEditable: true,
                availableModels: undefined,
                selectedModelIds: [],
                canRefreshCredentials: false,
                canEdit: true,
                canDelete: true,
                documentation: undefined
            }
        ],
        initialProviderName: "OpenAI"
    }
};
