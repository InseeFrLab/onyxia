import type { Meta, StoryObj } from "@storybook/react";
import { PortraitModeUnsupported } from "./PortraitModeUnsupported";

const meta = {
    title: "Shared/PortraitModeUnsupported",
    component: PortraitModeUnsupported
} satisfies Meta<typeof PortraitModeUnsupported>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};
