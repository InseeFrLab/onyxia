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
            isTestOngoing: false,
            stateDescription: "not tested yet"
        },
        onTestConnection: action("onTestConnection")
    }
};

export const Testing: Story = {
    args: {
        connectionTestStatus: {
            isTestOngoing: true,
            stateDescription: "not tested yet"
        },
        onTestConnection: undefined
    }
};

export const Success: Story = {
    args: {
        connectionTestStatus: {
            isTestOngoing: false,
            stateDescription: "success"
        },
        onTestConnection: () => {}
    }
};

export const Failed: Story = {
    args: {
        connectionTestStatus: {
            isTestOngoing: false,
            stateDescription: "failed",
            errorMessage: "Connection failed due to invalid credentials"
        },
        onTestConnection: () => {}
    }
};
