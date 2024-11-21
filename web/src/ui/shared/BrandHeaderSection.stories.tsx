import type { Meta, StoryObj } from "@storybook/react";
import { BrandHeaderSection } from "./BrandHeaderSection";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Shared/BrandHeaderSection",
    component: BrandHeaderSection
} satisfies Meta<typeof BrandHeaderSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        doShowOnyxia: true,
        link: { href: "", onClick: action("header") }
    }
};
