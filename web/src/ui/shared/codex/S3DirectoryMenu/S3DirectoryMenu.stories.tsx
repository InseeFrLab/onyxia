import type { Meta, StoryObj } from "@storybook/react";
import { useId, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { getIconUrlByName } from "lazy-icons";
import { S3DirectoryMenu, type S3DirectoryMenuProps } from "./S3DirectoryMenu";

function DirectoryMenuStory(args: S3DirectoryMenuProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const triggerId = useId();
    const menuId = useId();

    return (
        <div style={{ padding: 24, minHeight: 440 }}>
            <button
                id={triggerId}
                type="button"
                aria-haspopup="menu"
                aria-expanded={anchorEl !== null}
                aria-controls={anchorEl === null ? undefined : menuId}
                onClick={event => setAnchorEl(event.currentTarget)}
                onKeyDown={event => {
                    if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setAnchorEl(event.currentTarget);
                    }
                }}
            >
                Directory actions
            </button>
            <S3DirectoryMenu
                {...args}
                id={menuId}
                labelledBy={triggerId}
                anchorEl={anchorEl}
                onClose={() => {
                    setAnchorEl(null);
                    args.onClose();
                }}
            />
        </div>
    );
}

const baseArgs: S3DirectoryMenuProps = {
    id: "directory-menu",
    labelledBy: "directory-menu-trigger",
    anchorEl: null,
    onClose: fn(),
    actionGroups: [
        [
            {
                id: "copy",
                label: "Copy S3 path",
                icon: getIconUrlByName("ContentCopy"),
                onClick: fn()
            },
            {
                id: "bookmark",
                label: "Add to bookmarks",
                icon: getIconUrlByName("StarBorder"),
                onClick: fn()
            }
        ],
        [
            {
                id: "access-policy",
                label: "Make public",
                icon: getIconUrlByName("Public"),
                onClick: fn()
            }
        ],
        [
            {
                id: "create-directory",
                label: "Create new folder",
                icon: getIconUrlByName("CreateNewFolderOutlined"),
                onClick: fn()
            }
        ],
        [
            {
                id: "upload",
                label: "Upload files",
                icon: getIconUrlByName("UploadFileOutlined"),
                onClick: fn()
            },
            {
                id: "request-files",
                label: "Request files",
                icon: getIconUrlByName("DriveFolderUpload"),
                onClick: fn()
            },
            {
                id: "share",
                label: "Share",
                icon: getIconUrlByName("Share"),
                onClick: fn()
            }
        ],
        [
            {
                id: "refresh",
                label: "Refresh",
                icon: getIconUrlByName("Refresh"),
                onClick: fn()
            }
        ]
    ]
};

const meta = {
    title: "Shared/S3DirectoryMenu",
    component: S3DirectoryMenu,
    args: baseArgs,
    render: args => <DirectoryMenuStory {...args} />
} satisfies Meta<typeof S3DirectoryMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Directory actions" })
        );
        const menu = await within(canvasElement.ownerDocument.body).findByRole("menu");
        await expect(within(menu).getAllByRole("menuitem")).toHaveLength(8);
        await expect(
            within(menu).queryByRole("menuitem", { name: "Delete" })
        ).not.toBeInTheDocument();
        await expect(
            within(menu).queryByRole("menuitem", { name: "Download" })
        ).not.toBeInTheDocument();
    }
};

export const PublicAndBookmarked: Story = {
    args: {
        actionGroups: baseArgs.actionGroups.map(group =>
            group.map(action =>
                action.id === "bookmark"
                    ? {
                          ...action,
                          label: "Delete from bookmarks",
                          icon: getIconUrlByName("Star")
                      }
                    : action.id === "access-policy"
                      ? {
                            ...action,
                            label: "Make private",
                            icon: getIconUrlByName("PublicOff")
                        }
                      : action
            )
        )
    },
    play: Default.play
};

export const RestrictedActions: Story = {
    args: {
        actionGroups: [
            [
                baseArgs.actionGroups[0][0],
                {
                    ...baseArgs.actionGroups[0][1],
                    label: "Pinned storage location",
                    icon: getIconUrlByName("Business"),
                    onClick: undefined
                }
            ],
            [],
            [{ ...baseArgs.actionGroups[2][0], onClick: undefined }],
            [{ ...baseArgs.actionGroups[3][0], onClick: undefined }],
            baseArgs.actionGroups[4]
        ]
    },
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Directory actions" })
        );
        const menu = within(
            await within(canvasElement.ownerDocument.body).findByRole("menu")
        );
        await expect(
            menu.getByRole("menuitem", { name: "Pinned storage location" })
        ).toHaveAttribute("aria-disabled", "true");
        await expect(
            menu.getByRole("menuitem", { name: "Upload files" })
        ).toHaveAttribute("aria-disabled", "true");
        await expect(
            menu.queryByRole("menuitem", { name: "Make public" })
        ).not.toBeInTheDocument();
        await expect(menu.getAllByRole("separator")).toHaveLength(3);
    }
};

export const KeyboardNavigation: Story = {
    args: RestrictedActions.args,
    play: async ({ canvasElement, args }) => {
        const trigger = within(canvasElement).getByRole("button", {
            name: "Directory actions"
        });
        await userEvent.tab();
        await expect(trigger).toHaveFocus();
        await userEvent.keyboard("{ArrowDown}");
        const menu = within(
            await within(canvasElement.ownerDocument.body).findByRole("menu")
        );
        await expect(menu.getByRole("menuitem", { name: "Copy S3 path" })).toHaveFocus();
        await userEvent.keyboard("{ArrowDown}");
        await expect(menu.getByRole("menuitem", { name: "Refresh" })).toHaveFocus();
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(trigger).toHaveFocus());
        await expect(args.onClose).toHaveBeenCalledTimes(1);
        await expect(args.actionGroups[0][0].onClick).not.toHaveBeenCalled();
    }
};

export const SelectAction: Story = {
    play: async ({ canvasElement, args }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Directory actions" })
        );
        const body = within(canvasElement.ownerDocument.body);
        await userEvent.click(
            within(await body.findByRole("menu")).getByRole("menuitem", {
                name: "Create new folder"
            })
        );
        await expect(args.actionGroups[2][0].onClick).toHaveBeenCalledTimes(1);
        await expect(args.onClose).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(body.queryByRole("menu")).not.toBeInTheDocument());
    }
};
