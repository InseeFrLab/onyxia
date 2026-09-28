import type { Meta, StoryObj } from "@storybook/react";
import { CustomProviderFormDialogView } from "./CustomProviderFormDialog";

const meta = {
    title: "Pages/Account/IA/CustomProviderFormDialog",
    component: CustomProviderFormDialogView,
    parameters: {
        layout: "fullscreen"
    },
    args: {
        view: {
            isOpen: true,
            name: { value: "", isInvalid: false },
            providerType: {
                value: undefined,
                options: [
                    "openai",
                    "openai-compatible",
                    "mistral",
                    "anthropic",
                    "deepseek"
                ]
            },
            apiBase: { value: "", isInvalid: false },
            apiKey: { value: "" },
            connectionTest: { state: "not tested", canTest: false },
            models: { available: [], selected: [], isDisabled: true },
            hasSaveFailed: false,
            isSaving: false,
            canSave: false
        },
        onClose: () => {},
        onFieldChange: () => {},
        onProviderTypeChange: () => {},
        onTest: () => {},
        onSelectedModelsChange: () => {},
        onSave: () => {}
    }
} satisfies Meta<typeof CustomProviderFormDialogView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

const filledView = {
    ...meta.args.view,
    name: { value: "OpenAI", isInvalid: false },
    providerType: { ...meta.args.view.providerType, value: "openai" as const },
    apiBase: { value: "https://api.openai.com/v1", isInvalid: false },
    apiKey: { value: "sk-storybook" },
    canSave: true
};

export const Tested: Story = {
    args: {
        view: {
            ...filledView,
            connectionTest: { state: "succeeded", canTest: true },
            models: {
                available: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
                selected: ["gpt-4o", "gpt-4o-mini"],
                isDisabled: false
            }
        }
    }
};

export const Testing: Story = {
    args: {
        view: {
            ...filledView,
            connectionTest: { state: "testing", canTest: false },
            canSave: false
        }
    }
};

export const ConnectionFailure: Story = {
    args: {
        view: {
            ...filledView,
            connectionTest: { state: "failed", canTest: true }
        }
    }
};

export const InvalidName: Story = {
    args: {
        view: {
            ...filledView,
            name: { value: "Open/AI", isInvalid: true },
            canSave: false
        }
    }
};

export const SubmissionFailure: Story = {
    args: {
        view: { ...filledView, hasSaveFailed: true }
    }
};
