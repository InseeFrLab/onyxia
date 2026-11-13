import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { AddGitProviderDialog } from "./AddGitProviderDialog";

const meta = {
    title: "Pages/Account/Git/AddGitProviderDialog",
    component: AddGitProviderDialog,
    args: {
        view: { isOpen: true, isSubmitting: false, error: undefined },
        onClose: action("close"),
        onSubmit: action("submit"),
        getPersonalAccessTokenCreationUrl: ({ url }) =>
            url === "" ? undefined : `${url}/-/user_settings/personal_access_tokens`
    }
} satisfies Meta<typeof AddGitProviderDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Submitting: Story = {
    args: { view: { isOpen: true, isSubmitting: true, error: undefined } }
};

export const TokenRejected: Story = {
    args: {
        view: {
            isOpen: true,
            isSubmitting: false,
            error: "personal access token rejected"
        }
    }
};

export const ProviderUnreachable: Story = {
    args: {
        view: { isOpen: true, isSubmitting: false, error: "provider unreachable" }
    }
};
