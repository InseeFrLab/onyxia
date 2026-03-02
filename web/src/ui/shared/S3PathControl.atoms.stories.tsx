import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useRef, useState } from "react";
import {
    S3PathActionButton,
    S3PathBackButton,
    S3PathEditActions,
    S3PathEditInput,
    S3PathMessage,
    S3PathSegment,
    useStyles
} from "./S3PathControl";

const meta = {
    title: "Shared/S3PathControl/Atoms",
    component: S3PathBackButton
} satisfies Meta<typeof S3PathBackButton>;

export default meta;

type Story = StoryObj<typeof meta>;

type ActionStory = StoryObj<typeof S3PathActionButton>;

type SegmentStory = StoryObj<typeof S3PathSegment>;

type MessageStory = StoryObj<typeof S3PathMessage>;

const frameStyle = { maxWidth: 640 };

export const BackButton: Story = {
    args: {
        canGoBack: true
    },
    argTypes: {
        canGoBack: { control: "boolean" }
    },
    render: args => {
        const { classes, cx } = useStyles();

        return (
            <div style={frameStyle}>
                <S3PathBackButton
                    classes={classes}
                    cx={cx}
                    canGoBack={args.canGoBack}
                    onBack={action("back")}
                />
            </div>
        );
    }
};

export const ActionButtonPrimary: ActionStory = {
    render: () => {
        const { classes } = useStyles();

        return (
            <S3PathActionButton
                variant="primary"
                label="Validate"
                onClick={action("validate")}
                className={classes.actionButton}
            />
        );
    }
};

export const ActionButtonSecondary: ActionStory = {
    render: () => {
        const { classes } = useStyles();

        return (
            <S3PathActionButton
                variant="secondary"
                label="Validate"
                onClick={action("validate")}
                className={classes.actionButton}
            />
        );
    }
};

export const ActionButtonTertiary: ActionStory = {
    render: () => {
        const { classes } = useStyles();

        return (
            <S3PathActionButton
                variant="tertiary"
                label="Cancel"
                onClick={action("cancel")}
                className={classes.actionButton}
            />
        );
    }
};

export const SegmentRoot: SegmentStory = {
    render: () => {
        const { classes, cx } = useStyles();

        return (
            <div style={frameStyle}>
                <div className={cx(classes.bar, classes.barInteractive)}>
                    <S3PathSegment
                        classes={classes}
                        cx={cx}
                        variant="root"
                        label="s3://"
                        onClick={action("root")}
                    />
                </div>
            </div>
        );
    }
};

export const SegmentBucket: SegmentStory = {
    render: () => {
        const { classes, cx } = useStyles();

        return (
            <div style={frameStyle}>
                <div className={cx(classes.bar, classes.barInteractive)}>
                    <S3PathSegment
                        classes={classes}
                        cx={cx}
                        variant="bucket"
                        label="analytics-data"
                        onClick={action("bucket")}
                    />
                </div>
            </div>
        );
    }
};

export const SegmentPrefix: SegmentStory = {
    render: () => {
        const { classes, cx } = useStyles();

        return (
            <div style={frameStyle}>
                <div className={cx(classes.bar, classes.barInteractive)}>
                    <S3PathSegment
                        classes={classes}
                        cx={cx}
                        variant="prefix"
                        label="exports"
                        onClick={action("prefix")}
                    />
                </div>
            </div>
        );
    }
};

export const MessageSuccess: MessageStory = {
    render: () => {
        const { classes } = useStyles();

        return (
            <div style={frameStyle}>
                <S3PathMessage
                    classes={classes}
                    variant="success"
                    message="Path validated."
                />
            </div>
        );
    }
};

export const MessageInfo: MessageStory = {
    render: () => {
        const { classes } = useStyles();

        return (
            <div style={frameStyle}>
                <S3PathMessage classes={classes} variant="info" message="Path copied." />
            </div>
        );
    }
};

export const MessageError: MessageStory = {
    render: () => {
        const { classes } = useStyles();

        return (
            <div style={frameStyle}>
                <S3PathMessage
                    classes={classes}
                    variant="error"
                    message="Error: Bucket not found."
                />
            </div>
        );
    }
};

export const EditInputWithActions: Story = {
    render: () => {
        const { classes, cx } = useStyles();
        const [value, setValue] = useState("s3://analytics-data/exports/2024/report.csv");
        const inputRef = useRef<HTMLInputElement>(null);

        return (
            <div style={frameStyle}>
                <div className={cx(classes.bar, classes.barEditing)}>
                    <S3PathEditInput
                        classes={classes}
                        inputId="s3-path-input"
                        inputRef={inputRef}
                        value={value}
                        onChange={setValue}
                        onKeyDown={event => {
                            if (event.key === "Enter") {
                                action("submit")(value);
                            }
                        }}
                        isInteractive
                        errorText={null}
                        errorId="s3-path-error"
                    />
                    <div className={classes.actions}>
                        <S3PathEditActions
                            isInteractive
                            onCancel={action("cancel")}
                            onValidate={action("validate")}
                        />
                    </div>
                </div>
            </div>
        );
    }
};

export const EditInputWithActionsError: Story = {
    render: () => {
        const { classes, cx } = useStyles();
        const [value, setValue] = useState("s3://analytics-data//bad");
        const inputRef = useRef<HTMLInputElement>(null);

        return (
            <div style={frameStyle}>
                <div
                    className={cx(
                        classes.bar,
                        classes.barEditing,
                        classes.barError,
                        classes.barEditingError
                    )}
                >
                    <S3PathEditInput
                        classes={classes}
                        inputId="s3-path-input-error"
                        inputRef={inputRef}
                        value={value}
                        onChange={setValue}
                        onKeyDown={() => undefined}
                        isInteractive
                        errorText="Error: Invalid path format."
                        errorId="s3-path-error"
                    />
                    <div className={classes.actions}>
                        <S3PathEditActions
                            isInteractive
                            onCancel={action("cancel")}
                            onValidate={action("validate")}
                        />
                    </div>
                </div>
            </div>
        );
    }
};
