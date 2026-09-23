import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ModelsSelection } from "./ModelsSelection";

const models = [
    "gemma4-26b-moe",
    "gwen3-6-35b-moe",
    "qwen3-vl",
    "qwen3-embedding-8b",
    "chandra-ocr-2",
    "qwen3-8-27b"
];

const meta = {
    title: "Pages/Account/IA/ModelSelection",
    component: ModelsSelection,
    render: args => {
        const [selectedModels, setSelectedModels] = useState(args.selectedModels);

        return (
            <div style={{ width: 534, maxWidth: "100%" }}>
                <ModelsSelection
                    {...args}
                    selectedModels={selectedModels}
                    onSelectedModelsChange={setSelectedModels}
                />
            </div>
        );
    },
    args: {
        onSelectedModelsChange: () => {},
        models,
        selectedModels: models.slice(0, 3),
        disabled: false
    }
} satisfies Meta<typeof ModelsSelection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};

export const NoModels: Story = {
    args: { selectedModels: [], models: [] }
};

export const Disabled: Story = {
    args: { disabled: true }
};
