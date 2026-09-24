import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FormSelectField } from "./FormFields";

const meta = {
    title: "Pages/Account/IA/FormSelectField",
    component: FormSelectField,
    render: args => {
        const [value, setValue] = useState(args.value);

        return (
            <div style={{ width: 534, maxWidth: "100%" }}>
                <FormSelectField {...args} value={value} onChange={setValue} />
            </div>
        );
    },
    args: {
        label: "Choose a default model",
        placeholder: "Choose a default model",
        value: "",
        onChange: () => {},
        options: ["SSP Cloud LLM", "Personal OpenAI provider"].map(providerName => ({
            groupLabel: providerName,
            options: ["gemma4-26b-moe", "qwen3-6-35b-moe", "qwen3-vl"].map(modelId => ({
                value: `${providerName}/${modelId}`,
                label: modelId,
                selectedLabel: `${providerName}/${modelId}`
            }))
        }))
    }
} satisfies Meta<typeof FormSelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The default model picker: the models grouped by provider */
export const Grouped: Story = {};

export const Selected: Story = {
    args: { value: "SSP Cloud LLM/qwen3-vl" }
};
