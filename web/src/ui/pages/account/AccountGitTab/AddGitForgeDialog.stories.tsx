import { Suspense } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { AddGitForgeDialog } from "./AddGitForgeDialog";

const meta = {
    title: "Pages/Account/Git/AddGitForgeDialog",
    component: AddGitForgeDialog,
    // NOTE: The Drawer mounts its content synchronously, where a lazy icon suspends:
    // without a boundary React throws. The app has one around its pages.
    decorators: [
        Story => (
            <Suspense fallback={null}>
                <Story />
            </Suspense>
        )
    ],
    args: {
        view: { isOpen: true, isSubmitting: false, error: undefined },
        onClose: action("close"),
        onSubmit: action("submit"),
        getPersonalAccessTokenCreationUrl: ({ url }) =>
            url === "" ? undefined : `${url}/-/user_settings/personal_access_tokens`
    }
} satisfies Meta<typeof AddGitForgeDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** What was typed when the dialog was submitted */
const submittedValues = {
    type: "gitlab",
    url: "https://gitlab.com",
    displayName: "gitlab.com",
    personalAccessToken: "glpat-xxxxxxxxxxxxxxxxxxxx"
} as const;

export const Default: Story = {};

export const Submitting: Story = {
    args: {
        view: { isOpen: true, isSubmitting: true, error: undefined },
        initialValues: submittedValues
    }
};

export const TokenRejected: Story = {
    args: {
        view: {
            isOpen: true,
            isSubmitting: false,
            error: "personal access token rejected"
        },
        initialValues: submittedValues
    }
};

export const ForgeUnreachable: Story = {
    args: {
        view: { isOpen: true, isSubmitting: false, error: "forge unreachable" },
        initialValues: submittedValues
    }
};
