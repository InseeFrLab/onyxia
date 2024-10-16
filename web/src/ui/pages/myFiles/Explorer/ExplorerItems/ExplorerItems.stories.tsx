import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerItems } from "./ExplorerItems";
import { action } from "@storybook/addon-actions";
import type { Item } from "../../shared/types";
import { Evt } from "evt";

const meta = {
    title: "Pages/MyFiles/Explorer/ExplorerItems/ExplorerItems",
    component: ExplorerItems
} satisfies Meta<typeof ExplorerItems>;

export default meta;

type Story = StoryObj<typeof meta>;

const itemsSample = [
    {
        kind: "file",
        basename: "document.pdf",
        size: 1024000, // in bytes
        lastModified: new Date("2023-10-01"),
        policy: "private"
    },
    {
        kind: "file",
        basename: "photo.png",
        size: 2048000, // in bytes
        lastModified: new Date("2023-09-15"),
        policy: "public"
    },
    {
        kind: "directory",
        basename: "Projects",
        policy: "private"
    },
    {
        kind: "file",
        basename: "presentation.pptx",
        size: 5120000, // in bytes
        lastModified: new Date("2023-09-20"),
        policy: "private"
    },
    {
        kind: "directory",
        basename: "Photos",
        policy: "public"
    }
] satisfies Item[];

export const Default: Story = {
    args: {
        isNavigating: false,
        items: itemsSample,
        onNavigate: action("Navigate to directory"),
        onOpenFile: action("Open file"),
        onDeleteItem: action("Delete item"),
        onCopyPath: action("Copy path"),
        onSelectedItemKindValueChange: action("Selected item kind changed"),
        evtAction: Evt.create<"DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH">()
    }
};

export const EmptyDirectory: Story = {
    args: {
        isNavigating: false,
        items: [],
        onNavigate: action("Navigate to directory"),
        onOpenFile: action("Open file"),
        onDeleteItem: action("Delete item"),
        onCopyPath: action("Copy path"),
        onSelectedItemKindValueChange: action("Selected item kind changed"),
        evtAction: Evt.create<"DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH">()
    }
};
