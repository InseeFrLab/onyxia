import type { Meta, StoryObj } from "@storybook/react";
import { SettingField } from "./SettingField";

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
        onRequestServicePasswordRenewal: () => alert("Password renewed"),
        onRequestCopy: () => alert("Copied to clipboard")
    }
};
