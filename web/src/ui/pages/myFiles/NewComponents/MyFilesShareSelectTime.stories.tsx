import { Meta, StoryObj } from "@storybook/react";
import { MyFilesShareSelectTime } from "./MyFilesShareSelectTime";

const meta: Meta<typeof MyFilesShareSelectTime> = {
    title: "Pages/MyFiles/NewComponents/MyFilesShareSelectTime",
    component: MyFilesShareSelectTime
};

export default meta;

type Story = StoryObj<typeof MyFilesShareSelectTime>;

export const Default: Story = {
    args: {}
};
