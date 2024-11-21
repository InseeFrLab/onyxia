import type { Meta, StoryObj } from "@storybook/react";
import Page404 from "./Page404";

const meta = {
    title: "Pages/Page404",
    component: Page404
} satisfies Meta<typeof Page404>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};
