import type { Meta, StoryObj } from "@storybook/react";
import { CopyToClipboardIconButton } from "./CopyToClipboardIconButton";

const meta = {
    title: "Shared/CopyToClipboardIconButton",
    component: CopyToClipboardIconButton
} satisfies Meta<typeof CopyToClipboardIconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        textToCopy: "This is the default text to copy!"
    }
};
