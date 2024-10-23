import { Meta, StoryObj } from "@storybook/react";
import { TestS3ConnectionButton } from "./TestS3ConnectionButton";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/ProjectSettings/S3ConfigTab/TestS3ConnectionButton",
    component: TestS3ConnectionButton
} satisfies Meta<typeof TestS3ConnectionButton>;

export default meta;

type Story = StoryObj<typeof TestS3ConnectionButton>;

export const Default: Story = {
    args: {
        connectionTestStatus: {
            status: "not tested"
        },
        onTestConnection: action("onTestConnection")
    }
};

export const Testing: Story = {
    args: {
        connectionTestStatus: {
            status: "test ongoing"
        },
        onTestConnection: action("onTestConnection")
    }
};

export const Success: Story = {
    args: {
        connectionTestStatus: {
            status: "test succeeded"
        },
        onTestConnection: action("onTestConnection")
    }
};

export const Failed: Story = {
    args: {
        connectionTestStatus: {
            status: "test failed",
            errorMessage: "Connection failed due to invalid credentials"
        },
        onTestConnection: action("onTestConnection")
    }
};
