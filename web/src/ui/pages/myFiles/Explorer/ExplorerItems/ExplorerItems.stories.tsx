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

const itemsSample: Item[] = [
    {
        kind: "file",
        basename: "document.pdf",
        size: 1024000, // en bytes
        lastModified: new Date("2023-10-01"),
        policy: "private",
        canChangePolicy: true,
        isBeingDeleted: false,
        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "file",
        basename: "photo.png",
        size: 2048000, // en bytes
        lastModified: new Date("2023-09-15"),
        policy: "public",
        canChangePolicy: false,

        isBeingDeleted: false,
        isPolicyChanging: false,
        isBeingCreated: true,
        uploadPercent: 75 // Example upload percentage
    },
    {
        kind: "directory",
        basename: "Projects",
        policy: "private",
        isBeingDeleted: false,
        isPolicyChanging: true,
        isBeingCreated: false,
        canChangePolicy: true
    },
    {
        kind: "file",
        basename: "presentation.pptx",
        size: 5120000, // en bytes
        lastModified: new Date("2023-09-20"),
        policy: "private",
        canChangePolicy: true,

        isBeingDeleted: false,
        isPolicyChanging: false,
        isBeingCreated: false
    },
    {
        kind: "directory",
        basename: "Photos",
        policy: "public",
        canChangePolicy: true,

        isBeingDeleted: false,
        isPolicyChanging: false,
        isBeingCreated: false
    }
];

export const Default: Story = {
    args: {
        isNavigating: false,
        items: itemsSample,
        isBucketPolicyFeatureEnabled: true,
        onNavigate: action("Navigate to directory"),
        onOpenFile: action("Open file"),
        onDeleteItem: action("Delete item"),
        onCopyPath: action("Copy path"),
        onSelectedItemKindValueChange: action("Selected item kind changed"),
        onPolicyChange: action("Policy change"),
        evtAction: Evt.create<
            "DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH" | "SHARE SELECTED FILE"
        >(),
        onShare: action("Share file")
    }
};

export const EmptyDirectory: Story = {
    args: {
        isNavigating: false,
        items: [],
        isBucketPolicyFeatureEnabled: true,
        onNavigate: action("Navigate to directory"),
        onOpenFile: action("Open file"),
        onDeleteItem: action("Delete item"),
        onCopyPath: action("Copy path"),
        onPolicyChange: action("Policy change"),
        onSelectedItemKindValueChange: action("Selected item kind changed"),
        evtAction: Evt.create<
            "DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH" | "SHARE SELECTED FILE"
        >(),
        onShare: action("Share file")
    }
};
