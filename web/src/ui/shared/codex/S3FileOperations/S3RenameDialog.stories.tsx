import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { S3RenameDialog } from "./S3RenameDialog";
const meta = {
    tags: ["s3-file-operations"],
    title: "Shared/S3FileOperations/RenameDialog",
    component: S3RenameDialog,
    args: {
        isOpen: true,
        name: "report.csv",
        isDirectory: false,
        delimiter: "/",
        onConfirm: fn(),
        onClose: fn()
    }
} satisfies Meta<typeof S3RenameDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const File: Story = {};
export const Directory: Story = { args: { name: "reports", isDirectory: true } };
export const RenameWithKeyboard: Story = {
    play: async ({ canvasElement, args }) => {
        const page = within(canvasElement.ownerDocument.body);
        const input = page.getByRole("textbox", { name: "New name" });
        await userEvent.clear(input);
        await userEvent.type(input, "renamed.csv{Enter}");
        await expect(args.onConfirm).toHaveBeenCalledWith("renamed.csv");
    }
};
export const InvalidName: Story = {
    play: async ({ canvasElement, args }) => {
        const page = within(canvasElement.ownerDocument.body);
        const input = page.getByRole("textbox", { name: "New name" });
        await userEvent.clear(input);
        await userEvent.type(input, "nested/report.csv{Enter}");
        await expect(page.getByRole("button", { name: "Rename" })).toBeDisabled();
        await expect(args.onConfirm).not.toHaveBeenCalled();
    }
};
export const EscapeCancels: Story = {
    play: async ({ canvasElement, args }) => {
        await userEvent.click(
            within(canvasElement.ownerDocument.body).getByRole("textbox", {
                name: "New name"
            })
        );
        await userEvent.keyboard("{Escape}");
        await expect(args.onClose).toHaveBeenCalled();
        await expect(args.onConfirm).not.toHaveBeenCalled();
    }
};
