import type { Meta, StoryObj } from "@storybook/react";
import { S3ProfileSelector } from "./S3ProfileSelector";
import type { S3Profile } from "./types";

const meta = {
    title: "Shared/S3ProfileSelector",
    component: S3ProfileSelector
} satisfies Meta<typeof S3ProfileSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

const profiles: S3Profile[] = [
    {
        id: "managed-1",
        name: "Organisation Data Lake",
        type: "managed"
    },
    {
        id: "managed-2",
        name: "Managed Compliance Archive",
        type: "managed",
        status: "needsAttention"
    },
    {
        id: "personal-1",
        name: "Personal Sandbox",
        type: "personal"
    },
    {
        id: "personal-2",
        name: "My Long Personal Profile Name That Should Truncate",
        type: "personal",
        status: "invalid"
    }
];

export const ClosedState: Story = {
    args: {
        profiles,
        activeProfileId: "managed-1",
        profileCreationPolicy: "allowed",
        defaultOpen: false,
        onSelect: () => {},
        onCreateRequested: () => {}
    }
};

export const OpenState: Story = {
    args: {
        profiles,
        activeProfileId: "managed-1",
        profileCreationPolicy: "restricted",
        defaultOpen: true,
        onSelect: () => {},
        onCreateRequested: () => {}
    }
};

export const EmptyState: Story = {
    args: {
        profiles: [],
        activeProfileId: null,
        profileCreationPolicy: "disabled",
        defaultOpen: true,
        onSelect: () => {},
        onCreateRequested: () => {}
    }
};

export const CreationDisabled: Story = {
    args: {
        profiles,
        activeProfileId: "managed-1",
        profileCreationPolicy: "disabled",
        defaultOpen: true,
        onSelect: () => {},
        onCreateRequested: () => {}
    }
};

export const CreationRestricted: Story = {
    args: {
        profiles,
        activeProfileId: "personal-1",
        profileCreationPolicy: "restricted",
        defaultOpen: true,
        onSelect: () => {},
        onCreateRequested: () => {}
    }
};
