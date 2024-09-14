import type { Meta, StoryObj } from "@storybook/react";
import { SettingSectionHeader } from "./SettingSectionHeader";

const meta = {
    title: "Shared/SettingSectionHeader",
    component: SettingSectionHeader
} satisfies Meta<typeof SettingSectionHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: "Section Title",
        helperText: "This is some additional information.",
        tooltipText: "More details about this section"
    }
};
