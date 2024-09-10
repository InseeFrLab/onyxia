import { Meta, StoryObj } from "@storybook/react";
import { Evt } from "evt";
import { action } from "@storybook/addon-actions";
import { useState } from "react";
import { Button } from "onyxia-ui/Button";
import Terms from "./Terms";

const meta = {
    title: "Pages/Terms",
    component: Terms
} satisfies Meta<typeof Terms>;

export default meta;

type Story = StoryObj<typeof Terms>;

export const Default: Story = {
    args: {}
};
