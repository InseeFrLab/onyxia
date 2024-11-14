import { Meta, StoryObj } from "@storybook/react";
import { SelectTime } from "./SelectTime";

const meta: Meta<typeof SelectTime> = {
    title: "Pages/MyFiles/NewComponents/SelectTime",
    component: SelectTime
};

export default meta;

type Story = StoryObj<typeof SelectTime>;

export const Default: Story = {
    args: {}
};
