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
    component: MyServicesRestorableConfigs
} satisfies Meta<typeof MyServicesRestorableConfigs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isShortVariant: false,
        entries: [
            {
                restorableConfigRef: {
                    catalogId: "catalogId",
                    chartName: "chartName",
                    friendlyName: "friendlyName"
                },
                chartIconUrl: undefined,
                launchLink,
                editLink
            },
            {
                restorableConfigRef: {
                    catalogId: "catalogId",
                    chartName: "chartName",
                    friendlyName: "friendlyName 2"
                },
                chartIconUrl: undefined,
                launchLink,
                editLink
            }
        ],
        onRequestDelete: () => {
            action("Delete requested");
        },
        onRequestToggleIsShortVariant: () => {
            action("Toggle variant requested");
        },
        onRequestToMove: params => {
            action(`Move requested: ${JSON.stringify(params)}`);
        },
        onRequestRename: params => {
            action(`Rename requested : ${params.newFriendlyName}`);
        }
    }
};

export const ShortVariant: Story = {
    args: {
        ...Default.args,
        isShortVariant: true
    }
};
