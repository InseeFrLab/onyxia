import type { Meta, StoryObj } from "@storybook/react";
import { YamlCodeBlockFormField } from "./YamlCodeBlockFormField";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "pages/Launcher/formFields/YamlCodeBlock",
    component: YamlCodeBlockFormField
} satisfies Meta<typeof YamlCodeBlockFormField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        "title": "This is the title",
        "description": "This is the description",
        "expectedDataType": "object",
        "value": {
            "key1": "value1",
            "key2": "value2"
        },
        "onChange": action("Value changed")
    }
};
