import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useState } from "react";
import { EntryPointsList } from "./EntryPointsList";

const meta = {
    title: "Bookmarks/EntryPointsList",
    component: EntryPointsList
} satisfies Meta<typeof EntryPointsList>;

export default meta;

type Story = StoryObj<typeof meta>;

const buckets = [
    {
        label: "analytics-data",
        path: "s3://analytics-data",
        type: "personal"
    },
    {
        label: "datasets",
        path: "s3://datasets",
        type: "group"
    },
    {
        label: "raw-exports",
        path: "s3://raw-exports",
        type: "read-only"
    }
];

const pinned = [
    {
        id: "pin-exports",
        label: "Exports",
        path: "s3://analytics-data/exports",
        subLabel: "analytics-data/exports"
    },
    {
        id: "pin-reports",
        label: "Reports",
        path: "s3://analytics-data/exports/2024",
        subLabel: "analytics-data/exports/2024"
    }
];

export const Default: Story = {
    render: () => {
        const [currentPath, setCurrentPath] = useState(buckets[0].path);
        const [pinnedState, setPinnedState] = useState(pinned);

        return (
            <EntryPointsList
                buckets={buckets}
                pinned={pinnedState}
                currentPath={currentPath}
                onNavigate={path => {
                    action("navigate")(path);
                    setCurrentPath(path);
                }}
                onUnpin={path => {
                    action("unpin")(path);
                    setPinnedState(prev => prev.filter(item => item.path !== path));
                }}
            />
        );
    }
};

type EntryPointsPlaygroundArgs = {
    label: string;
    path: string;
    subLabel: string;
    bucketLabel: string;
    bucketPath: string;
    bucketType: "personal" | "group" | "read-write" | "read-only";
    currentPath: string;
};

export const Playground: StoryObj<typeof EntryPointsList> = {
    args: {
        label: "Custom label",
        path: "s3://example-bucket/long/path/for/testing",
        subLabel: "example-bucket/long/path/for/testing",
        bucketLabel: "example-bucket",
        bucketPath: "s3://example-bucket",
        bucketType: "personal",
        currentPath: "s3://example-bucket/long/path/for/testing"
    } satisfies EntryPointsPlaygroundArgs,
    argTypes: {
        label: { control: "text" },
        path: { control: "text" },
        subLabel: { control: "text" },
        bucketLabel: { control: "text" },
        bucketPath: { control: "text" },
        bucketType: {
            control: "select",
            options: ["personal", "group", "read-write", "read-only"]
        },
        currentPath: { control: "text" }
    },
    render: args => (
        <EntryPointsList
            buckets={[
                {
                    label: args.bucketLabel,
                    path: args.bucketPath,
                    type: args.bucketType
                }
            ]}
            pinned={[
                {
                    id: "pin-playground",
                    label: args.label,
                    path: args.path,
                    subLabel: args.subLabel
                }
            ]}
            currentPath={args.currentPath}
            onNavigate={action("navigate")}
            onUnpin={action("unpin")}
        />
    )
};

export const BucketTypesOrdering: Story = {
    render: () => {
        const [currentPath, setCurrentPath] = useState("s3://personal-bucket");
        const [pinnedState, setPinnedState] = useState([
            {
                id: "pin-1",
                label: "Pinned One",
                path: "s3://personal-bucket/exports",
                subLabel: "personal-bucket/exports"
            },
            {
                id: "pin-2",
                label: "Pinned Two",
                path: "s3://group-project-bucket/designs",
                subLabel: "group-project-bucket/designs"
            }
        ]);

        return (
            <EntryPointsList
                buckets={[
                    {
                        label: "Group project beta",
                        path: "s3://group-project-beta",
                        type: "group"
                    },
                    {
                        label: "Read-only archive",
                        path: "s3://readonly-archive",
                        type: "read-only"
                    },
                    {
                        label: "Personal bucket",
                        path: "s3://personal-bucket",
                        type: "personal"
                    },
                    {
                        label: "Read & write shared",
                        path: "s3://shared-rw",
                        type: "read-write"
                    },
                    {
                        label: "Group project alpha",
                        path: "s3://group-project-alpha",
                        type: "group"
                    }
                ]}
                pinned={pinnedState}
                currentPath={currentPath}
                onNavigate={path => {
                    action("navigate")(path);
                    setCurrentPath(path);
                }}
                onUnpin={path => {
                    action("unpin")(path);
                    setPinnedState(prev => prev.filter(item => item.path !== path));
                }}
            />
        );
    }
};
