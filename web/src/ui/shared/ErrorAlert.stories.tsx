import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { ErrorAlert } from "ui/shared/ErrorAlert";

const meta = {
    title: "Shared/ErrorAlert",
    component: ErrorAlert,
    args: {
        title: "Connection failed.",
        message: "Please check your credentials or endpoint."
    }
} satisfies Meta<typeof ErrorAlert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
    args: {
        title: "Unable to save your changes.",
        message: "Your changes are kept on this page. Try again in a moment.",
        action: { label: "Retry", onClick: action("onClick") }
    }
};
