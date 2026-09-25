import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { AddCustomProviderButton } from "./AddCustomProviderButton";

const meta = {
    title: "Pages/Account/IA/AddCustomProviderButton",
    component: AddCustomProviderButton,
    args: {
        label: "Add a new custom AI provider",
        onClick: action("onClick")
    }
} satisfies Meta<typeof AddCustomProviderButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
