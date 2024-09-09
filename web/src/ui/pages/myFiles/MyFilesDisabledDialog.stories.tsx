import type { Meta, StoryObj } from "@storybook/react";
import { MyFilesDisabledDialog } from "./MyFilesDisabledDialog";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyFiles/MyFilesDisabledDialog",
    component: MyFilesDisabledDialog
} satisfies Meta<typeof MyFilesDisabledDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
    parameters: {
        actions: {
            handles: ["click button", "close dialog"]
        }
    },
    play: ({ canvasElement }) => {
        const dialog = canvasElement.querySelector('[role="dialog"]');
        action("Dialog Opened")(dialog);
    }
};
