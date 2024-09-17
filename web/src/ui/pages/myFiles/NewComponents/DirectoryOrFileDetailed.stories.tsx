import { Meta, StoryObj } from "@storybook/react";
import { DirectoryOrFileDetailed } from "./DirectoryOrFileDetailed";

const meta = {
    title: "Pages/MyFiles/NewComponents/DirectoryOrFileDetailed",
    component: DirectoryOrFileDetailed
} satisfies Meta<typeof DirectoryOrFileDetailed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Directory: Story = {
    args: {
        name: "My Documents",
        size: 1024,
        kind: "directory",
        isPublic: false
    }
};

export const File: Story = {
    args: {
        name: "report.pdf",
        size: 2048,
        kind: "file",
        isPublic: true
    }
};
