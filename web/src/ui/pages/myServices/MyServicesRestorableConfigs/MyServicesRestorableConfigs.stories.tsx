import type { Meta, StoryObj } from "@storybook/react";
import { MyServicesRestorableConfigs } from "./MyServicesRestorableConfigs";
import { action } from "@storybook/addon-actions";

const launchLink = {
    href: "",
    onClick: action("launchLink")
};

const editLink = {
    href: "",
    onClick: action("editLink")
};

const meta = {
    title: "Pages/MyServices/MyServicesRestorableConfigs",
    component: MyServicesRestorableConfigs,
    args: {
        isShortVariant: false,
        entries: [
            {
                restorableConfigIndex: 0,
                chartIconUrl: undefined,
                friendlyName: "My App 1",
                launchLink,
                editLink
            },
            {
                restorableConfigIndex: 1,
                chartIconUrl: undefined,
                friendlyName: "My App 2",
                launchLink,
                editLink
            }
        ],
        onRequestDelete: () => {
            action("Delete requested");
        },
        onRequestToggleIsShortVariant: () => {
            action("Toggle variant requested");
        }
    }
} satisfies Meta<typeof MyServicesRestorableConfigs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortVariant: Story = {
    args: {
        isShortVariant: true
    }
};
