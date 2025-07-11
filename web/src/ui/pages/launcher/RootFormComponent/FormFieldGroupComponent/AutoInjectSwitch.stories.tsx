import type { Meta, StoryObj } from "@storybook/react";
import { AutoInjectSwitch } from "./AutoInjectSwitch";
import { useState } from "react";

const meta = {
    title: "pages/Launcher/AutoInjectSwitch",
    component: StoryWrapper
} satisfies Meta<typeof StoryWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

function StoryWrapper() {
    const [isAutoInjected, setIsAutoInjected] = useState(true);

    return (
        <AutoInjectSwitch isAutoInjected={isAutoInjected} onChange={setIsAutoInjected} />
    );
}

export const Default: Story = {
    args: {}
};
