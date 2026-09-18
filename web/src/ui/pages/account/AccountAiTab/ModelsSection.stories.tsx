import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ModelsSection } from "./ModelsSection";
const meta = {
    title: "Pages/Account/AI model selection",
    component: ModelsSection,
    render: args => {
        const [selectedModels, setSelectedModels] = useState(args.selectedModels);
        return (
            <div style={{ width: 480 }}>
                <ModelsSection
                    {...args}
                    selectedModels={selectedModels}
                    onSelectedModelsChange={setSelectedModels}
                />
            </div>
        );
    },
    args: {
        onSelectedModelsChange: () => {},
        models: [{ id: "model-a" }, { id: "model-b" }, { id: "org/model-c" }],
        selectedModels: [],
        disabled: false
    }
} satisfies Meta<typeof ModelsSection>;
export default meta;
export const Empty: StoryObj<typeof meta> = {};
export const Selected: StoryObj<typeof meta> = {
    args: { selectedModels: ["model-a", "org/model-c"] }
};
