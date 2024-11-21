import type { Meta, StoryObj } from "@storybook/react";
import { MyServicesRestorableConfig } from "./MyServicesRestorableConfig";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyServices/MyServicesRestorableConfigs/MyServicesRestorableConfig/MyServicesRestorableConfig",
    component: MyServicesRestorableConfig
} satisfies Meta<typeof MyServicesRestorableConfig>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isShortVariant: false,
        chartIconUrl:
            "https://minio.lab.sspcloud.fr/projet-onyxia/assets/servicesImg/vscode.png",
        friendlyName: "Example Service",
        launchLink: { href: "", onClick: action("launch") },
        editLink: { href: "", onClick: action("edit") },
        onRequestDelete: action("requestDelete")
    }
};

export const ShortVariant: Story = {
    args: {
        ...Default.args,
        isShortVariant: true
    }
};

export const NoIcon: Story = {
    args: {
        ...Default.args,
        chartIconUrl: undefined
    }
};
