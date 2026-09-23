import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useState } from "react";
import type { ThemedAssetUrl } from "onyxia-ui";
import { ProviderCard, type ProviderState } from "./ProviderCard";
import { providerTypeLogoUrl } from "./shared/providerTypeLogoUrl";

const models = [
    "gemma4-26b-moe",
    "gwen3-6-35b-moe",
    "qwen3-vl",
    "qwen3-embedding-8b",
    "chandra-ocr-2",
    "qwen3-8-27b"
];

const onManage = action("Manage button clicked");

function ProviderCardStory(props: {
    state: ProviderState;
    name: string;
    subtitle: string;
    logoUrl: ThemedAssetUrl;
}) {
    const [selectedModels, setSelectedModels] = useState(models.slice(0, 3));

    return (
        <ProviderCard
            name={props.name}
            subtitle={props.subtitle}
            state={props.state}
            manageLabel="Manage"
            onManage={onManage}
            modelSelector={{
                models: models,
                selectedModels,
                isDisabled: false,
                onSelectedModelsChange: setSelectedModels
            }}
            logoUrl={props.logoUrl}
        />
    );
}

const meta = {
    title: "Pages/Account/IA/ProviderCard",
    component: ProviderCardStory,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        )
    ],
    args: {
        state: "connected",
        name: "SSPCloud LLM",
        subtitle: "Provided by your organization",
        logoUrl: "https://minio.lab.sspcloud.fr/ddecrulle/public/sspcloud-llm.png"
    }
} satisfies Meta<typeof ProviderCardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Connected: Story = {};

export const SetupRequired: Story = {
    args: { state: "setup required" }
};

export const ConnectionError: Story = {
    args: { state: "connection error" }
};

export const CustomProvider: Story = {
    args: {
        name: "My Mistral",
        subtitle: "Custom AI providers",
        logoUrl: providerTypeLogoUrl["mistral"]
    }
};
