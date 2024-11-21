import type { Meta, StoryObj } from "@storybook/react";
import { MyServicesRestorableConfigOptions } from "./MyServicesRestorableConfigOptions";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyServices/MyServicesRestorableConfigs/MyServicesRestorableConfig/MyServicesRestorableConfigOptions",
    component: MyServicesRestorableConfigOptions
} satisfies Meta<typeof MyServicesRestorableConfigOptions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        callback: action("callback")
    }
};
