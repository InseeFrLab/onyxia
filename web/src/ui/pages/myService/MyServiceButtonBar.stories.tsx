import type { Meta, StoryObj } from "@storybook/react";
import { MyServiceButtonBar } from "./MyServiceButtonBar";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyService/MyServiceButtonBar",
    component: MyServiceButtonBar
} satisfies Meta<typeof MyServiceButtonBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        monitoringUrl: undefined, // Monitoring URL is not provided
        onClickBack: action("Back button clicked"),
        areHelmValuesShown: false,
        onClickHelmValues: action("Helm Values button clicked")
    }
};

export const WithMonitoringUrl: Story = {
    args: {
        ...Default.args,
        monitoringUrl: "https://example.com/monitoring" // Monitoring URL is provided
    }
};

export const HelmValuesShown: Story = {
    args: {
        ...Default.args,
        areHelmValuesShown: true // Helm values are already shown
    }
};
