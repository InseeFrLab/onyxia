import type { Meta, StoryObj } from "@storybook/react";
import { ListExplorerItems } from "./ListExplorerItems";
import { action } from "@storybook/addon-actions";
import { Evt } from "evt";
import { Item } from "../../shared/types";

const meta = {
    title: "Pages/MyFiles/Explorer/ListExplorerItems",
    component: ListExplorerItems
} satisfies Meta<typeof ListExplorerItems>;

export default meta;

type Story = StoryObj<typeof meta>;

const itemsSample: Item[] = [
    {
        kind: "file",
        basename: "document.pdf",
        size: 1024000, // en bytes
        lastModified: new Date("2023-10-01"),
        policy: "private",
        isBeingUploaded: false,
        isBeingDeleted: false,
        isPolicyChanging: false
    },
    {
        kind: "file",
        basename: "photo.png",
        size: 2048000, // en bytes
        lastModified: new Date("2023-09-15"),
        policy: "public",
        isBeingUploaded: false,
        isBeingDeleted: false,
        isPolicyChanging: false
    },
    {
        kind: "directory",
        basename: "Projects",
        policy: "private",
        isBeingUploaded: false,
        isBeingDeleted: false,
        isPolicyChanging: false
    },
    {
        kind: "file",
        basename: "presentation.pptx",
        size: 5120000, // en bytes
        lastModified: new Date("2023-09-20"),
        policy: "private",
        isBeingUploaded: false,
        isBeingDeleted: false,
        isPolicyChanging: false
    },
    {
        kind: "directory",
        basename: "Photos",
        policy: "public",
        isBeingUploaded: false,
        isBeingDeleted: false,
        isPolicyChanging: false
    }
];

export const Default: Story = {
    args: {
        isNavigating: false,
        items: itemsSample,
        onNavigate: action("Navigate to directory"),
        onOpenFile: action("Open file"),
        onDeleteItem: action("Delete item"),
        onPolicyChange: action("Policy change"),
        onCopyPath: action("Copy path"),
        onSelectedItemKindValueChange: action("Selected item kind changed"),
        evtAction: Evt.create<"DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH">()
    }
};
