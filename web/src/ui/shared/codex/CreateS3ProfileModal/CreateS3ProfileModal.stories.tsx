import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useEffect, useState } from "react";
import { Button } from "onyxia-ui/Button";
import { userEvent, within } from "@storybook/test";
import {
    CreateS3ProfileModal,
    type CreateS3ProfileModalProps
} from "./CreateS3ProfileModal";

const meta = {
    title: "Shared/CreateS3ProfileModal",
    component: CreateS3ProfileModal
} satisfies Meta<typeof CreateS3ProfileModal>;

export default meta;

type Story = StoryObj<typeof meta>;

function StatefulCreateS3ProfileModal(props: CreateS3ProfileModalProps) {
    const { open, onClose, onSubmit, ...rest } = props;
    const [isOpen, setIsOpen] = useState(open);

    useEffect(() => {
        setIsOpen(open);
    }, [open]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Button variant="secondary" onClick={() => setIsOpen(true)}>
                Open modal
            </Button>
            <CreateS3ProfileModal
                {...rest}
                open={isOpen}
                onClose={() => {
                    onClose();
                    setIsOpen(false);
                }}
                onSubmit={params => {
                    onSubmit(params);
                    setIsOpen(false);
                }}
            />
        </div>
    );
}

const baseArgs: CreateS3ProfileModalProps = {
    open: true,
    onClose: action("close"),
    onSubmit: action("submit"),
    isSubmitting: false
};

export const Default: Story = {
    args: {
        ...baseArgs
    },
    render: args => <StatefulCreateS3ProfileModal {...args} />
};

export const StepNavigation: Story = {
    args: {
        ...baseArgs
    },
    render: args => <StatefulCreateS3ProfileModal {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(await canvas.findByRole("button", { name: "Next" }));
    }
};

export const AnonymousAccessEnabled: Story = {
    args: {
        ...baseArgs,
        defaultValue: {
            anonymousAccess: true
        }
    },
    render: args => <StatefulCreateS3ProfileModal {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(await canvas.findByRole("button", { name: "Next" }));
        await userEvent.click(await canvas.findByRole("button", { name: "Next" }));
    }
};

export const FullCredentialsFilled: Story = {
    args: {
        ...baseArgs,
        defaultValue: {
            profileName: "Personal Sandbox",
            serviceUrl: "https://s3.eu-west-1.example.com",
            region: "eu-west-1",
            urlStyle: "virtualHosted",
            anonymousAccess: false,
            accessKeyId: "1A2B3C4D5E6F7G8H9I0J",
            secretAccessKey: "topsecretaccesskeyvalue",
            sessionToken: "session-token-optional"
        }
    },
    render: args => <StatefulCreateS3ProfileModal {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(await canvas.findByRole("button", { name: "Next" }));
        await userEvent.click(await canvas.findByRole("button", { name: "Next" }));
    }
};
