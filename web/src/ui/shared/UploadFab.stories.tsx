import type { Meta, StoryObj } from "@storybook/react";
import { UploadFab } from "./UploadFab";
import { action } from "@storybook/addon-actions";

const meta: Meta<typeof UploadFab> = {
    title: "Shared/UploadFab",
    component: UploadFab
};

export default meta;

type Story = StoryObj<typeof UploadFab>;

export const Default: Story = {
    args: {
        onClick: () => action("Upload clicked")
    }
};
