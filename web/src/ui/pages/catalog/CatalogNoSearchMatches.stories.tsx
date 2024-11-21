import type { Meta, StoryObj } from "@storybook/react";
import { CatalogNoSearchMatches } from "./CatalogNoSearchMatches";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/Catalog/CatalogNoSearchMatches",
    component: CatalogNoSearchMatches
} satisfies Meta<typeof CatalogNoSearchMatches>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        search: "example service",
        onGoBackClick: action("Go back clicked")
    }
};
