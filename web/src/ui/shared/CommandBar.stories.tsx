import type { Meta, StoryObj } from "@storybook/react";
import { CommandBar, type CommandBarProps } from "./CommandBar";

const meta = {
    title: "Shared/CommandBar",
    component: CommandBar
} satisfies Meta<typeof CommandBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleEntries: CommandBarProps.Entry[] = [
    { cmdId: 1, cmd: "ls -la", resp: "file1.txt\nfile2.txt" },
    { cmdId: 2, cmd: "echo 'Hello World'", resp: "Hello World" },
    { cmdId: 3, cmd: "pwd", resp: "/home/user" }
];

const downloadAction = {
    tooltipTitle: "Download logs",
    onClick: () => alert("Logs downloaded!")
};

const helpDialog = {
    title: "Help",
    body: "This is a command bar where you can run different commands and view their responses."
};

export const Default: Story = {
    args: {
        entries: sampleEntries,
        maxHeight: 400,
        downloadButton: downloadAction,
        helpDialog,
        isExpended: true
    }
};
