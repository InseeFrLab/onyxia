import type { Meta, StoryObj } from "@storybook/react";
import { S3SharePrefixDialog } from "./S3SharePrefixDialog";

const meta = {
    title: "Shared/S3SharePrefixDialog",
    component: S3SharePrefixDialog
} satisfies Meta<typeof S3SharePrefixDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

const onyxiaUrl =
    "https://datalab.sspcloud.fr/s3/garronej/public/fortnite?profile=anonymous";

export const Default: Story = {
    args: {
        prefixBasename: "fortnite",
        onyxiaUrl
    },
    render: args => (
        <div style={{ maxWidth: 760, padding: 32, overflow: "hidden" }}>
            <S3SharePrefixDialog {...args} />
        </div>
    )
};

export const LongUrl: Story = {
    args: {
        prefixBasename: "quarterly statistical exports",
        onyxiaUrl:
            "https://datalab.sspcloud.fr/s3/garronej/public/quarterly%20statistical%20exports/with/a/deeply/nested/folder/whose/full/url/must/remain/visible?profile=anonymous-profile-with-a-long-name"
    },
    render: Default.render
};

export const BucketRoot: Story = {
    args: {
        prefixBasename: undefined,
        onyxiaUrl: "https://datalab.sspcloud.fr/s3/garronej/?profile=anonymous"
    },
    render: Default.render
};
