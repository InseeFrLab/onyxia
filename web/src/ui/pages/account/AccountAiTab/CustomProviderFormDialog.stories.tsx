import type { Meta, StoryObj } from "@storybook/react";
import { CustomProviderFormDialogView, type ViewProps } from "./CustomProviderFormDialog";

const meta = {
    title: "Pages/Account/CustomProviderFormDialog",
    component: CustomProviderFormDialogView,
    parameters: {
        layout: "fullscreen"
    }
} satisfies Meta<typeof CustomProviderFormDialogView>;

export default meta;

type Story = StoryObj<typeof meta>;

const doNothing = () => {};

const commonArgs: Pick<
    ViewProps,
    | "supportedProtocols"
    | "onClose"
    | "onFieldChange"
    | "onProviderChange"
    | "onTest"
    | "onSave"
    | "onDoSetAsDefaultChange"
> = {
    supportedProtocols: ["openai", "openai-compatible", "mistral", "anthropic"],
    onClose: doNothing,
    onFieldChange: doNothing,
    onProviderChange: doNothing,
    onTest: doNothing,
    onSave: doNothing,
    onDoSetAsDefaultChange: doNothing
};

export const Default: Story = {
    args: {
        ...commonArgs,
        isEditing: false,
        isAlreadyDefault: false,
        values: {
            name: "",
            provider: "",
            apiBase: "",
            apiKey: "",
            selectedModelId: ""
        },
        test: { stateDescription: "idle" },
        doSetAsDefault: false,
        canSave: false,
        canTest: false
    }
};

export const Filled: Story = {
    args: {
        ...commonArgs,
        isEditing: true,
        isAlreadyDefault: false,
        values: {
            name: "Custom Provider 1",
            provider: "openai",
            apiBase: "https://llm.example.test/api",
            apiKey: "storybook-api-key",
            selectedModelId: "qwen3-vl"
        },
        test: {
            stateDescription: "success",
            models: [
                { id: "gemma4-26b-moe", name: "gemma4-26b-moe" },
                { id: "qwen3-6-35b-mo", name: "qwen3-6-35b-mo" },
                { id: "qwen3-embedding-8b", name: "qwen3-embedding-8b" },
                { id: "qwen3-vl", name: "qwen3-vl" }
            ]
        },
        doSetAsDefault: false,
        canSave: true,
        canTest: true
    }
};
