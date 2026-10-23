import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { S3FileOperationConflictDialog } from "./S3FileOperationConflictDialog";
const meta = {
    tags: ["s3-file-operations"],
    title: "Shared/S3FileOperations/ConflictDialog",
    component: S3FileOperationConflictDialog,
    args: {
        isOpen: true,
        questionId: "first",
        kind: "directory",
        operation: "move",
        name: "foo",
        source: "s3://bucket/foo/",
        destination: "s3://bucket/xxx/foo/",
        onResolve: fn()
    }
} satisfies Meta<typeof S3FileOperationConflictDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MergeDirectory: Story = {};
export const OverwriteObject: Story = {
    args: {
        kind: "object",
        name: "a.csv",
        source: "s3://bucket/a.csv",
        destination: "s3://bucket/xxx/a.csv"
    }
};
export const RememberMerge: Story = {
    play: async ({ canvasElement, args }) => {
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(page.getByRole("checkbox"));
        await userEvent.click(page.getByRole("button", { name: "Merge" }));
        await expect(args.onResolve).toHaveBeenCalledWith({
            action: "proceed",
            doRememberChoice: true
        });
    }
};
export const Skip: Story = {
    play: async ({ canvasElement, args }) => {
        await userEvent.click(
            within(canvasElement.ownerDocument.body).getByRole("button", {
                name: "Skip (keep existing)"
            })
        );
        await expect(args.onResolve).toHaveBeenCalledWith({
            action: "skip",
            doRememberChoice: false
        });
    }
};
export const CancelAll: Story = {
    play: async ({ canvasElement, args }) => {
        await userEvent.click(
            within(canvasElement.ownerDocument.body).getByRole("button", {
                name: "Cancel all"
            })
        );
        await expect(args.onResolve).toHaveBeenCalledWith({ action: "cancel" });
    }
};
export const NextQuestionResetsRememberChoice: Story = {
    render: function Render(args) {
        const [questionId, setQuestionId] = useState("first");
        return (
            <S3FileOperationConflictDialog
                {...args}
                questionId={questionId}
                onResolve={response => {
                    args.onResolve(response);
                    setQuestionId("second");
                }}
            />
        );
    },
    play: async ({ canvasElement }) => {
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(page.getByRole("checkbox"));
        await userEvent.click(page.getByRole("button", { name: "Merge" }));
        await expect(page.getByRole("checkbox")).not.toBeChecked();
    }
};
