import type { Meta, StoryObj } from "@storybook/react";
import { CircularMetric } from "./CircularMetric";

console.log(import.meta.env);
const meta = {
    title: "Shared/CircularMetric",
    component: CircularMetric
} satisfies Meta<typeof CircularMetric>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        percentage: 50,
        severity: "info",
        children: null
    }
};
