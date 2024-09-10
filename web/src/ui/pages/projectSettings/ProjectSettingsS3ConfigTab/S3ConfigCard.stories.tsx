import type { Meta, StoryObj } from "@storybook/react";
import { S3ConfigCard } from "./S3ConfigCard";

const meta = {
    title: "Pages/ProjectSettings/S3ConfigTab/S3ConfigCard",
    component: S3ConfigCard
} satisfies Meta<typeof S3ConfigCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        dataSource: "MinIO",
        region: "us-east-1",
        accountFriendlyName: "Test Account",
        isUsedForExplorer: true,
        isUsedForXOnyxia: false,
        onDelete: () => console.log("Delete clicked"),
        onIsUsedForExplorerValueChange: isUsed =>
            console.log("Explorer usage changed:", isUsed),
        onIsUsedForXOnyxiaValueChange: isUsed =>
            console.log("XOnyxia usage changed:", isUsed),
        onEdit: () => console.log("Edit clicked"),
        doHideUsageSwitches: false,
        connectionTestStatus: {
            stateDescription: "not tested yet",
            isTestOngoing: false
        },
        onTestConnection: () => console.log("Test connection clicked")
    }
};

export const HiddenSwitches: Story = {
    args: {
        ...Default.args,
        doHideUsageSwitches: true
    }
};

export const NoEditDelete: Story = {
    args: {
        ...Default.args,
        onDelete: undefined,
        onEdit: undefined
    }
};

export const ConnectionTested: Story = {
    args: {
        ...Default.args,
        connectionTestStatus: { stateDescription: "success", isTestOngoing: false }
    }
};
