import type { Meta, StoryObj } from "@storybook/react";
import { UrlInput } from "./UrlInput";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/DataExplorer/UrlInput",
    component: UrlInput
} satisfies Meta<typeof UrlInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        url: "https://example.com",
        onUrlChange: action("URL changed")
    }
};
