import type { Meta, StoryObj } from "@storybook/react";
import { SwitcherButton } from "./SwitcherButton";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Shared/SwitcherButton",
    component: SwitcherButton
} satisfies Meta<typeof SwitcherButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isSelected: false,
        onClick: action("Button clicked"),
        text: <span>Interactive services</span>
    }
};
