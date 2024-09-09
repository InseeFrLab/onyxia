import type { Meta, StoryObj } from "@storybook/react";
import { CatalogSwitcherButton } from "./CatalogSwitcherButton";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/Catalog/CatalogSwitcherButton",
    component: CatalogSwitcherButton
} satisfies Meta<typeof CatalogSwitcherButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isSelected: false,
        onClick: action("Button clicked"),
        text: <span>Interactive services</span>
    }
};
