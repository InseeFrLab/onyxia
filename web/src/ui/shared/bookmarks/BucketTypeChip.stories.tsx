import type { Meta, StoryObj } from "@storybook/react";
import { BucketTypeChip } from "./BucketTypeChip";

const meta = {
    title: "Bookmarks/BucketTypeChip",
    component: BucketTypeChip
} satisfies Meta<typeof BucketTypeChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllTypes: Story = {
    render: () => (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <BucketTypeChip type="personal" />
            <BucketTypeChip type="group" />
            <BucketTypeChip type="read-write" />
            <BucketTypeChip type="read-only" />
        </div>
    )
};

export const Playground: Story = {
    args: {
        type: "personal",
        showIcon: true,
        colorVariant: "personal"
    },
    argTypes: {
        type: {
            control: "select",
            options: ["personal", "group", "read-write", "read-only"]
        },
        colorVariant: {
            control: "select",
            options: ["personal", "group", "read-write", "read-only"]
        },
        showIcon: { control: "boolean" }
    },
    render: args => <BucketTypeChip {...args} />
};
