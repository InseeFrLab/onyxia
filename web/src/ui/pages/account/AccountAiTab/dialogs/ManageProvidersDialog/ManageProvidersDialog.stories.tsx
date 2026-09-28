import type { Meta, StoryObj } from "@storybook/react";
import { ManageProvidersDialogView } from "./ManageProvidersDialog";

const meta = {
    title: "Pages/Account/IA/ManageProvidersDialog",
    component: ManageProvidersDialogView,
    parameters: {
        layout: "fullscreen"
    },
    args: {
        view: {
            isOpen: true,
            providerName: "SSP Cloud LLM",
            providerNames: ["SSP Cloud LLM", "OpenAI"],
            origin: "configured by admin",
            connectionState: "connected",
            configuration: undefined,
            apiBase: {
                value: "https://llm.example.test/api",
                isEditable: false,
                isInvalid: false
            },
            apiKey: { value: "storybook-api-key", isEditable: false },
            alert: undefined,
            connectionTest: { isTesting: false, canTest: true },
            credentialsRefresh: { isRefreshing: false },
            models: {
                available: [
                    "gemma4-26b-moe",
                    "qwen3-6-35b-moe",
                    "llama-3.3-70b",
                    "mistral-small"
                ],
                selected: ["gemma4-26b-moe", "qwen3-6-35b-moe"],
                isDisabled: false
            },
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
} satisfies Meta<typeof ManageProvidersDialogView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EditableCredentials: Story = {
    args: {
        view: {
            ...meta.args.view,
            providerName: "OpenAI",
            apiKey: { value: "", isEditable: true },
            alert: "api-key not provided",
            connectionState: "setup required",
            credentialsRefresh: undefined,
            models: { available: [], selected: [], isDisabled: false },
            documentation: undefined
        }
    }
};

export const CustomProvider: Story = {
    args: {
        view: {
            ...meta.args.view,
            providerName: "OpenAI",
            origin: "created by user",
            configuration: {
                name: { value: "OpenAI", isInvalid: false },
                providerType: {
                    value: "openai",
                    options: [
                        "openai",
                        "openai-compatible",
                        "mistral",
                        "anthropic",
                        "deepseek"
                    ]
                }
            },
            apiBase: {
                value: "https://api.openai.com/v1",
                isEditable: true,
                isInvalid: false
            },
            apiKey: { value: "", isEditable: true },
            credentialsRefresh: undefined,
            canDelete: true,
            documentation: undefined
        }
    }
};

export const TestingConnection: Story = {
    args: {
        view: {
            ...meta.args.view,
            connectionTest: { isTesting: true, canTest: false }
        }
    }
};

export const ConnectionFailed: Story = {
    args: {
        view: {
            ...meta.args.view,
            connectionState: "connection error",
            alert: "connection failed"
        }
    }
};
