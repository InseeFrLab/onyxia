import type { Meta, StoryObj } from "@storybook/react";
import { CircularUsage } from "./CircularUsage";

const meta = {
    title: "Pages/MyServices/Quotas/CircularUsage",
    component: CircularUsage,
    args: {
        name: "limits.cpu",
        used: "500m",
        total: "1000m",
        usagePercentage: 50,
        severity: "warning"
    }
} satisfies Meta<typeof CircularUsage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LowUsage: Story = {
    args: {
        name: "limits.memory",
        used: "100Mi",
        total: "200Mi",
        usagePercentage: 10,
        severity: "success"
    }
};

export const HighUsage: Story = {
    args: {
        name: "requests.memory",
        used: "900Mi",
        total: "1000Mi",
        usagePercentage: 90,
        severity: "error"
    }
};
