import type { Meta, StoryObj } from "@storybook/react";
import { BrandHeaderSection } from "./BrandHeaderSection";
import { storyLink } from "ui/tools/storybook/storyLink";

const meta = {
    title: "Shared/BrandHeaderSection",
    component: BrandHeaderSection
} satisfies Meta<typeof BrandHeaderSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        doShowOnyxia: true,
        link: storyLink
    }
};
