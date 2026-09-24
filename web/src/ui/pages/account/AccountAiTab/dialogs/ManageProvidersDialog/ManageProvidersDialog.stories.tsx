import type { Meta, StoryObj } from "@storybook/react";
import { ManageProvidersDialog } from "./ManageProvidersDialog";

const meta = {
    title: "Pages/Account/IA/ManageProvidersDialog",
    component: ManageProvidersDialog,
    parameters: {
        layout: "fullscreen"
    },
    args: {
        providerNames: ["SSP Cloud LLM", "OpenAI"],
        provider: {
            name: "SSP Cloud LLM",
            subtitle: "Provided by your organization",
            state: "connected",
            configuration: undefined,
            apiBase: "https://llm.example.test/api",
            isApiBaseEditable: false,
            apiBaseError: undefined,
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
            canTestConnection: true,
            canRefreshCredentials: true,
            isRefreshingCredentials: false,
            canSave: true,
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
        },
        onProviderChange: () => {},
        onClose: () => {},
        onNameChange: () => {},
        onProviderTypeChange: () => {},
        onApiBaseChange: () => {},
        onApiKeyChange: () => {},
        onSelectedModelsChange: () => {},
        onRefreshCredentials: () => {},
        onTestConnection: () => {},
        onSave: () => {},
        onDelete: () => {}
    }
} satisfies Meta<typeof ManageProvidersDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EditableCredentials: Story = {
    args: {
        provider: {
            ...meta.args.provider,
            name: "OpenAI",
            subtitle: "Provided by your organization",
            apiKey: "",
            isApiKeyEditable: true,
            availableModels: undefined,
            selectedModelIds: [],
            canRefreshCredentials: false,
            documentation: undefined
        }
    }
};

export const CustomProvider: Story = {
    args: {
        provider: {
            ...meta.args.provider,
            name: "OpenAI",
            subtitle: "Custom AI providers",
            configuration: {
                name: "OpenAI",
                providerType: "openai",
                supportedProviderTypes: [
                    "openai",
                    "openai-compatible",
                    "mistral",
                    "anthropic",
                    "deepseek"
                ],
                nameError: undefined
            },
            apiBase: "https://api.openai.com/v1",
            isApiBaseEditable: true,
            apiKey: "",
            isApiKeyEditable: true,
            canRefreshCredentials: false,
            canDelete: true,
            documentation: undefined
        }
    }
};
