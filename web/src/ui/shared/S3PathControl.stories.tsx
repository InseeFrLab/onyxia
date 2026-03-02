import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useEffect, useState } from "react";
import { userEvent, within } from "@storybook/test";
import {
    S3PathControl,
    type S3PathControlProps,
    type ValidationResult
} from "./S3PathControl";

const meta = {
    title: "Shared/S3PathControl",
    component: S3PathControl
} satisfies Meta<typeof S3PathControl>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultValidatePath = async (draftPath: string): Promise<ValidationResult> => ({
    status: "success",
    resolvedPath: draftPath
});

function StatefulS3PathControl(args: S3PathControlProps) {
    const [value, setValue] = useState(args.value);

    useEffect(() => {
        setValue(args.value);
    }, [args.value]);

    return (
        <S3PathControl
            {...args}
            value={value}
            onNavigate={nextPath => {
                args.onNavigate(nextPath);
                setValue(nextPath);
            }}
        />
    );
}

const baseArgs = {
    value: "s3://analytics-data/exports/2024/quarter-1/report.csv",
    onNavigate: action("navigate"),
    onCopy: action("copy"),
    onBookmark: action("bookmark"),
    onCreatePrefix: action("create prefix"),
    onImportData: action("import data"),
    onError: action("error"),
    validatePath: defaultValidatePath
};

export const ReadSimplePath: Story = {
    args: {
        ...baseArgs,
        value: "s3://example-bucket"
    },
    render: args => <StatefulS3PathControl {...args} />
};

export const Default: Story = {
    args: {
        ...baseArgs,
        value: "s3://bucket-name"
    },
    render: args => <StatefulS3PathControl {...args} />
};

export const Raised: Story = {
    args: {
        ...baseArgs,
        value: "s3://bucket-name"
    },
    render: args => <StatefulS3PathControl {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const nav = canvas.getByRole("navigation", { name: /s3 path/i });
        await userEvent.hover(nav);
    }
};

export const Editing: Story = {
    args: {
        ...baseArgs,
        value: "s3://bucket-name/prefix/"
    },
    render: args => <StatefulS3PathControl {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /edit/i }));
    }
};

export const ReadLongPath: Story = {
    args: {
        ...baseArgs,
        value: "s3://very-long-bucket-name/one/two/three/four/five/six/seven/eight/nine/ten/asset.parquet"
    },
    render: args => (
        <div style={{ maxWidth: 420 }}>
            <StatefulS3PathControl {...args} />
        </div>
    )
};

export const EditTyping: Story = {
    args: {
        ...baseArgs,
        value: "s3://example-bucket/prefix/"
    },
    render: args => <StatefulS3PathControl {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /edit/i }));
        const input = canvas.getByRole("textbox", { name: /s3 path/i });
        await userEvent.clear(input);
        await userEvent.type(input, "s3://example-bucket/typed/prefix/");
    }
};

export const EditPaste: Story = {
    args: {
        ...baseArgs,
        value: "s3://example-bucket/prefix/"
    },
    render: args => <StatefulS3PathControl {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /edit/i }));
        const input = canvas.getByRole("textbox", { name: /s3 path/i });
        await userEvent.clear(input);
        await userEvent.paste(input, "s3://example-bucket/pasted/path/object.csv");
    }
};

export const ValidatingLoading: Story = {
    args: {
        ...baseArgs,
        validatePath: () => new Promise<ValidationResult>(() => {})
    },
    render: args => <StatefulS3PathControl {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /edit/i }));
        await userEvent.click(canvas.getByRole("button", { name: /validate/i }));
    }
};

export const ValidateSuccess: Story = {
    args: {
        ...baseArgs,
        validatePath: async draftPath => ({
            status: "success",
            resolvedPath: draftPath
        })
    },
    render: args => <StatefulS3PathControl {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /edit/i }));
        await userEvent.click(canvas.getByRole("button", { name: /validate/i }));
    }
};

export const ValidateEmpty: Story = {
    args: {
        ...baseArgs,
        validatePath: async draftPath => ({
            status: "empty",
            resolvedPath: draftPath
        })
    },
    render: args => <StatefulS3PathControl {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /edit/i }));
        await userEvent.click(canvas.getByRole("button", { name: /validate/i }));
    }
};

export const ValidateErrorAccessDenied: Story = {
    args: {
        ...baseArgs,
        validatePath: async () => ({
            status: "error",
            error: { code: "ACCESS_DENIED" }
        })
    },
    render: args => <StatefulS3PathControl {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /edit/i }));
        await userEvent.click(canvas.getByRole("button", { name: /validate/i }));
    }
};

export const ValidateErrorBucketNotFound: Story = {
    args: {
        ...baseArgs,
        validatePath: async () => ({
            status: "error",
            error: { code: "BUCKET_NOT_FOUND" }
        })
    },
    render: args => <StatefulS3PathControl {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /edit/i }));
        await userEvent.click(canvas.getByRole("button", { name: /validate/i }));
    }
};

export const Disabled: Story = {
    args: {
        ...baseArgs,
        disabled: true
    },
    render: args => <StatefulS3PathControl {...args} />
};
