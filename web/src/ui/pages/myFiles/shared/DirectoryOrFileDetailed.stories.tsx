import { Meta, StoryObj } from "@storybook/react";
import { DirectoryOrFileDetailed } from "./DirectoryOrFileDetailed";

const meta = {
    title: "Pages/MyFiles/shared/DirectoryOrFileDetailed",
    component: DirectoryOrFileDetailed
} satisfies Meta<typeof DirectoryOrFileDetailed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Directory: Story = {
    args: {
        name: "My Documents",
        kind: "directory",
        isPublic: false
    }
};

export const File: Story = {
    args: {
        name: "report.pdf",
        kind: "file",
        isPublic: true
    }
};
