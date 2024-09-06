import type { Meta, StoryObj } from "@storybook/react";
import { AccountGitTab } from "./AccountGitTab";

const meta = {
    title: "Pages/Account",
    component: AccountGitTab
} satisfies Meta<typeof AccountGitTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AccountGitTabStory: Story = {
    args: {}
};
