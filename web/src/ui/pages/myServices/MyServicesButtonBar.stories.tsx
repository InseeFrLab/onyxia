import type { Meta, StoryObj } from "@storybook/react";
import { MyServicesButtonBar } from "./MyServicesButtonBar";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyServices/MyServicesButtonBar",
    component: MyServicesButtonBar
} satisfies Meta<typeof MyServicesButtonBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        className: "",
        isThereNonOwnedServicesShown: false,
        isThereDeletableServices: false,
        eventsNotificationCount: 0,
        onClick: action("Button clicked")
    }
};

export const WithEventsNotification: Story = {
    args: {
        ...Default.args,
        eventsNotificationCount: 5 // Shows a badge with 5 event notifications
    }
};

export const DeletableServices: Story = {
    args: {
        ...Default.args,
        isThereDeletableServices: true // Enables the delete button
    }
};

export const NonOwnedServicesShown: Story = {
    args: {
        ...Default.args,
        isThereNonOwnedServicesShown: true // Changes the trash label to "trash my own"
    }
};
