import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { AddCustomProviderButton } from "ui/shared/AddCustomProviderButton";

const meta = {
    title: "Shared/AddCustomProviderButton",
    component: AddCustomProviderButton,
    args: {
        label: "Add a new custom AI provider",
        onClick: action("onClick")
    }
} satisfies Meta<typeof AddCustomProviderButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
