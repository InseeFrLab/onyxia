import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { S3FileOperations, type S3FileOperationsProps } from "./S3FileOperations";
const operation: S3FileOperationsProps["operations"][number] = {
    id: "move",
    operation: "move",
    name: "nyr_data.csv",
    destination: "s3://bucket/archive/",
    phase: "copying",
    percent: 72,
    completedCount: 3,
    totalCount: 5,
    copiedSize: 5_700_000,
    totalSize: 7_800_000,
    errors: []
};
const meta = {
    tags: ["s3-file-operations"],
    title: "Shared/S3FileOperations/Progress",
    component: S3FileOperations,
    args: { operations: [operation], onCancel: fn(), onDismissCompleted: fn() }
} satisfies Meta<typeof S3FileOperations>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Copying: Story = {};
export const Discovering: Story = {
    args: {
        operations: [
            {
                ...operation,
                phase: "listing",
                percent: undefined,
                totalCount: undefined,
                totalSize: undefined
            }
        ]
    }
};
export const Deleting: Story = {
    args: { operations: [{ ...operation, phase: "deleting", percent: 99 }] }
};
export const Completed: Story = {
    args: {
        operations: [
            { ...operation, phase: "completed", percent: 100, completedCount: 5 }
        ]
    }
};
export const PartialFailure: Story = {
    args: {
        operations: [
            {
                ...operation,
                phase: "errored",
                errors: ["Copied a.csv, but failed to delete its source: access denied"]
            }
        ]
    }
};
export const Mixed: Story = {
    args: {
        operations: [
            operation,
            {
                ...operation,
                id: "copy",
                operation: "copy",
                phase: "completed",
                percent: 100
            },
            {
                ...operation,
                id: "rename",
                operation: "rename",
                phase: "canceled",
                percent: 20
            }
        ]
    }
};
export const CancelOperation: Story = {
    play: async ({ canvasElement, args }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", {
                name: "Cancel operation for nyr_data.csv"
            })
        );
        await expect(args.onCancel).toHaveBeenCalledWith("move");
    }
};
export const CloseWhileRunning: Story = {
    play: async ({ canvasElement, args }) => {
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(page.getByRole("button", { name: "Close operations" }));
        await expect(args.onDismissCompleted).not.toHaveBeenCalled();
        await userEvent.click(await page.findByRole("button", { name: "Cancel all" }));
        await expect(args.onCancel).toHaveBeenCalledWith("move");
        await expect(args.onDismissCompleted).toHaveBeenCalled();
    }
};
export const Collapse: Story = {
    play: async ({ canvasElement }) => {
        const page = within(canvasElement);
        await userEvent.click(page.getByRole("button", { name: "Collapse operations" }));
        await expect(page.queryByText("Move nyr_data.csv")).not.toBeInTheDocument();
        await userEvent.click(page.getByRole("button", { name: "Expand operations" }));
        await expect(page.getByText("Move nyr_data.csv")).toBeVisible();
    }
};
