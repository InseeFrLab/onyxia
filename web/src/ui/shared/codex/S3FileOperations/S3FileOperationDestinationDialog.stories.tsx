import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within, waitFor } from "@storybook/test";
import { S3FileOperationDestinationDialog } from "./S3FileOperationDestinationDialog";

const directories: Record<string, { name: string; uri: string }[]> = {
    "s3://analytics/": ["exports", "raw", "reports", "archive", "models"].map(name => ({
        name,
        uri: `s3://analytics/${name}/`
    })),
    "s3://analytics/archive/": [{ name: "2026", uri: "s3://analytics/archive/2026/" }]
};
const meta = {
    tags: ["s3-file-operations"],
    title: "Shared/S3FileOperations/DestinationDialog",
    component: S3FileOperationDestinationDialog,
    args: {
        isOpen: true,
        operation: "move",
        itemCount: 2,
        initialDestination: "s3://analytics/",
        delimiter: "/",
        sources: [{ uri: "s3://source/reports/", isDirectory: true }],
        loadDirectories: async (directory: string) => directories[directory] ?? [],
        onConfirm: fn(),
        onClose: fn()
    }
} satisfies Meta<typeof S3FileOperationDestinationDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Move: Story = {};
export const Copy: Story = { args: { operation: "copy" } };
export const Empty: Story = { args: { initialDestination: "s3://analytics/empty/" } };
export const Loading: Story = { args: { loadDirectories: () => new Promise(() => {}) } };
export const AccessDenied: Story = {
    args: {
        loadDirectories: async () => {
            throw new Error("Access denied to this directory");
        }
    }
};
export const LongPath: Story = {
    args: {
        initialDestination:
            "s3://analytics/very-long-directory-name/another-long-directory-name/2026/reports/"
    }
};
export const BrowseAndConfirm: Story = {
    play: async ({ canvasElement, args }) => {
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(await page.findByRole("button", { name: "archive" }));
        await page.findByRole("button", { name: "2026" });
        await userEvent.click(page.getByRole("button", { name: "Move items" }));
        await expect(args.onConfirm).toHaveBeenCalledWith("s3://analytics/archive/");
    }
};
export const InvalidSelfDestination: Story = {
    args: { sources: [{ uri: "s3://analytics/reports/", isDirectory: true }] },
    play: async ({ canvasElement }) => {
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(await page.findByRole("button", { name: "reports" }));
        await page.findByRole("alert");
        await expect(page.getByRole("button", { name: "Move items" })).toBeDisabled();
    }
};
export const CreatePrefixAndConfirm: Story = {
    play: async ({ canvasElement, args }) => {
        const page = within(canvasElement.ownerDocument.body);
        await waitFor(() =>
            expect(page.getByRole("button", { name: "Create new prefix" })).toBeEnabled()
        );
        await userEvent.click(page.getByRole("button", { name: "Create new prefix" }));
        await userEvent.type(
            page.getByRole("textbox", { name: "New folder name" }),
            "new-destination"
        );
        await userEvent.click(page.getByRole("button", { name: "Create" }));
        await waitFor(() =>
            expect(page.getByRole("button", { name: "Move items" })).toBeEnabled()
        );
        await userEvent.click(page.getByRole("button", { name: "Move items" }));
        await expect(args.onConfirm).toHaveBeenCalledWith(
            "s3://analytics/new-destination/"
        );
    }
};
export const EditDestination: Story = {
    play: async ({ canvasElement, args }) => {
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(
            page.getByRole("button", { name: "Edit destination path" })
        );
        const input = page.getByRole("textbox", { name: "Destination path" });
        await userEvent.clear(input);
        await userEvent.type(input, "s3://another-bucket/archive{Enter}");
        await waitFor(() =>
            expect(page.getByRole("button", { name: "Move items" })).toBeEnabled()
        );
        await userEvent.click(page.getByRole("button", { name: "Move items" }));
        await expect(args.onConfirm).toHaveBeenCalledWith("s3://another-bucket/archive/");
    }
};
