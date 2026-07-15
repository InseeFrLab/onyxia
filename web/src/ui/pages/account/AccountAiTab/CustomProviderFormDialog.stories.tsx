import type { Meta, StoryObj } from "@storybook/react";
import { Evt, type UnpackEvt } from "evt";
import { CustomProviderFormDialog, type Props } from "./CustomProviderFormDialog";

const meta = {
    title: "Pages/Account/CustomProviderFormDialog",
    component: CustomProviderFormDialog,
    parameters: {
        layout: "fullscreen"
    }
} satisfies Meta<typeof CustomProviderFormDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

const evtOpenDefault = Evt.create<UnpackEvt<Props["evtOpen"]>>();

export const Default: Story = {
    args: {
        evtOpen: evtOpenDefault
    },
    play: () => {
        evtOpenDefault.post({ editedProvider: undefined });
    }
};

const evtOpenFilled = Evt.create<UnpackEvt<Props["evtOpen"]>>();

export const Filled: Story = {
    args: {
        evtOpen: evtOpenFilled
    },
    play: () => {
        evtOpenFilled.post({
            editedProvider: {
                id: "custom-provider-1",
                name: "Custom Provider 1",
                provider: "openai",
                apiBase: "https://llm.example.test/api",
                apiKey: "storybook-api-key",
                availableModels: [
                    { id: "gemma4-26b-moe", name: "gemma4-26b-moe" },
                    { id: "qwen3-6-35b-mo", name: "qwen3-6-35b-mo" },
                    { id: "qwen3-embedding-8b", name: "qwen3-embedding-8b" },
                    { id: "qwen3-vl", name: "qwen3-vl" }
                ],
                selectedModelId: "qwen3-vl",
                isDefault: false
            }
        });
    }
};
