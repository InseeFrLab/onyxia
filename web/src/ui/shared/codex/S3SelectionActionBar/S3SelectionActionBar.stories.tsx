import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import {
    S3SelectionActionBar,
    type S3SelectionActionBarProps
} from "./S3SelectionActionBar";

const meta = {
    tags: ["s3-file-operations"],
    title: "Shared/S3SelectionActionBar",
    component: S3SelectionActionBar
} satisfies Meta<typeof S3SelectionActionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs: S3SelectionActionBarProps = {
    selectionCount: 1,
    onClear: action("clear"),
    download: {
        callback: action("download")
    },
    delete: {
        callback: action("delete")
    },
    copyS3Uri: {
        callback: action("copyS3Uri"),
        s3UriStr: "s3://demo-bucket/path/to/object.csv"
    },
    bookmark: {
        callback: action("bookmark"),
        isBookmarked: false
    },
    share: {
        callback: action("share")
    },
    requestFiles: undefined,
    accessPolicy: undefined
};

export const SingleObject: Story = {
    args: {
        ...baseArgs
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The five actions and the separate clear-selection button.
        await expect(canvas.getAllByRole("button")).toHaveLength(6);
        await expect(
            canvas.queryByRole("button", { name: "More actions" })
        ).not.toBeInTheDocument();
    }
};

export const WithSixActions: Story = {
    args: {
        ...baseArgs,
        accessPolicy: { callback: fn(), isPublic: false }
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        const trigger = canvas.getByRole("button", { name: "More actions" });
        await expect(canvas.getAllByRole("button")).toHaveLength(7);
        await expect(
            canvas.queryByRole("button", { name: "Make public" })
        ).not.toBeInTheDocument();
        await userEvent.click(trigger);
        const menu = within(await body.findByRole("menu", { name: "More actions" }));
        await expect(menu.getAllByRole("menuitem")).toHaveLength(1);
        await expect(trigger).toHaveAttribute("aria-expanded", "true");
        await userEvent.click(menu.getByRole("menuitem", { name: "Make public" }));
        await expect(args.accessPolicy?.callback).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(body.queryByRole("menu")).not.toBeInTheDocument());
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
};

export const WithSevenActions: Story = {
    args: {
        ...baseArgs,
        requestFiles: { callback: fn() },
        accessPolicy: { callback: fn(), isPublic: true }
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        const trigger = canvas.getByRole("button", { name: "More actions" });
        await expect(canvas.getAllByRole("button")).toHaveLength(7);
        await expect(
            canvas.queryByRole("button", { name: "Request files" })
        ).not.toBeInTheDocument();
        await userEvent.click(trigger);
        const menu = within(await body.findByRole("menu", { name: "More actions" }));
        await expect(menu.getAllByRole("menuitem").map(item => item.textContent)).toEqual(
            ["Request files", "Make private"]
        );
        await userEvent.click(menu.getByRole("menuitem", { name: "Request files" }));
        await expect(args.requestFiles?.callback).toHaveBeenCalledTimes(1);
        await expect(args.accessPolicy?.callback).not.toHaveBeenCalled();
        await waitFor(() => expect(body.queryByRole("menu")).not.toBeInTheDocument());
    }
};

export const OverflowKeyboardNavigation: Story = {
    args: {
        ...baseArgs,
        bookmark: { callback: undefined, isBookmarked: true },
        onClear: undefined,
        requestFiles: { callback: fn() },
        accessPolicy: { callback: fn(), isPublic: true }
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        const trigger = canvas.getByRole("button", { name: "More actions" });
        await expect(
            canvas.queryByRole("button", { name: "Clear selection" })
        ).not.toBeInTheDocument();
        await expect(
            canvas.getByRole("button", { name: "Delete from bookmarks" })
        ).toBeDisabled();

        // Five actions occupy the tab order: the disabled bookmark is skipped.
        for (let i = 0; i < 5; i++) {
            await userEvent.tab();
        }
        await expect(trigger).toHaveFocus();
        await userEvent.keyboard("{ArrowDown}");
        let menu = within(await body.findByRole("menu", { name: "More actions" }));
        await expect(menu.getByRole("menuitem", { name: "Request files" })).toHaveFocus();
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(trigger).toHaveFocus());
        await expect(args.requestFiles?.callback).not.toHaveBeenCalled();
        await expect(args.accessPolicy?.callback).not.toHaveBeenCalled();

        await userEvent.keyboard("{Enter}");
        menu = within(await body.findByRole("menu", { name: "More actions" }));
        await userEvent.keyboard("{ArrowDown}");
        await expect(menu.getByRole("menuitem", { name: "Make private" })).toHaveFocus();
        await userEvent.keyboard("{Enter}");
        await expect(args.accessPolicy?.callback).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(body.queryByRole("menu")).not.toBeInTheDocument());
    }
};

export const LockedSingleObject: Story = {
    args: {
        ...baseArgs,
        onClear: undefined
    }
};

export const SinglePrefix: Story = {
    args: {
        ...baseArgs,
        download: undefined,
        share: undefined,
        requestFiles: {
            callback: action("requestFiles")
        },
        accessPolicy: {
            callback: action("makePublic"),
            isPublic: false
        }
    }
};

export const PublicBookmarkedPrefix: Story = {
    args: {
        ...baseArgs,
        download: undefined,
        bookmark: {
            callback: action("bookmark"),
            isBookmarked: true
        },
        share: undefined,
        requestFiles: {
            callback: action("requestFiles")
        },
        accessPolicy: {
            callback: action("makePrivate"),
            isPublic: true
        }
    }
};

export const MultipleSelection: Story = {
    args: {
        ...baseArgs,
        selectionCount: 2,
        download: undefined,
        copyS3Uri: undefined,
        bookmark: undefined,
        share: undefined,
        accessPolicy: undefined
    }
};

export const FileOperations: Story = {
    args: {
        ...baseArgs,
        copy: { callback: fn() },
        move: { callback: fn() },
        rename: { callback: fn() }
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole("button")).toHaveLength(7);
        await userEvent.click(canvas.getByRole("button", { name: "Move to…" }));
        await expect(args.move?.callback).toHaveBeenCalledTimes(1);
        await userEvent.click(canvas.getByRole("button", { name: "More actions" }));
        const menu = within(
            await within(canvasElement.ownerDocument.body).findByRole("menu")
        );
        await expect(menu.getByRole("menuitem", { name: "Copy S3 URI" })).toBeVisible();
    }
};
