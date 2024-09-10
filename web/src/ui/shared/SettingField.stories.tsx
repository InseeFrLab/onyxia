import type { Meta, StoryObj } from "@storybook/react";
import { SettingField } from "./SettingField";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Shared/SettingField",
    component: SettingField
} satisfies Meta<typeof SettingField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        type: "service password",
        groupProjectName: "Project A",
        servicePassword: "mypassword",
        onRequestServicePasswordRenewal: () => action("Password renewed"),
        onRequestCopy: () => action("Copied to clipboard")
    }
};
