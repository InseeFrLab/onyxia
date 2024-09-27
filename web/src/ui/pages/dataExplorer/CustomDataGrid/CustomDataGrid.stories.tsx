import type { Meta, StoryObj } from "@storybook/react";
import { ColumnAutosizing } from "./CustomDataGrid";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/DataExplorer/ColumnAutosizing",
    component: ColumnAutosizing
} satisfies Meta<typeof ColumnAutosizing>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};
