import type { Meta, StoryObj } from "@storybook/react";
import { LoadingDots } from "./LoadingDots";

const meta = {
    title: "Shared/LoadingDots",
    component: LoadingDots
} satisfies Meta<typeof LoadingDots>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};
