import type { Meta, StoryObj } from "@storybook/react";
import { ResizableColumnHeader } from "./ResizableColumnHeader";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/DataExplorer/ResizableColumnHeader",
    component: ResizableColumnHeader
} satisfies Meta<typeof ResizableColumnHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        label: "Column Header",
        width: 150,
        onResize: action("Column resized")
    }
};
