import type { Meta, StoryObj } from "@storybook/react";
import { ListExplorerItems } from "./ListExplorerItems";
import { action } from "@storybook/addon-actions";
import { Evt } from "evt";

const meta = {
    title: "Pages/MyFiles/Explorer/ListExplorerItems",
    component: ListExplorerItems
} satisfies Meta<typeof ListExplorerItems>;

export default meta;

type Story = StoryObj<typeof meta>;

const itemsSample: ListExplorerItems["items"] = [
    {
        kind: "file",
        size: 2048,
        basename: "document.pdf",
        lastModified: new Date("2023-09-14T10:34:00Z"),
        policy: "public"
    },
    {
        kind: "directory",
        basename: "photos",
        policy: "private"
    },
    {
        kind: "file",
        size: 1048576,
        basename: "video.mp4",
        lastModified: new Date("2023-12-01T08:12:45Z"),
        policy: "private"
    },
    {
        kind: "directory",
        basename: "projects",
        policy: "private"
    },
    {
        kind: "file",
        size: 512,
        basename: "notes.txt",
        lastModified: new Date("2024-09-10T11:42:25Z"),
        policy: "public"
    },
    {
        kind: "file",
        size: 12345,
        basename: "presentation.pptx",
        lastModified: new Date("2023-06-20T09:15:00Z"),
        policy: "public"
    },
    {
        kind: "file",
        size: 789456,
        basename: "music.mp3",
        lastModified: new Date("2023-11-11T12:45:00Z"),
        policy: "private"
    },
    {
        kind: "directory",
        basename: "archive",
        policy: "private"
    },
    {
        kind: "file",
        size: 500,
        basename: "readme.md",
        lastModified: new Date("2024-02-15T10:00:00Z"),
        policy: "public"
    },
    {
        kind: "directory",
        basename: "backup",
        policy: "private"
    },
    {
        kind: "file",
        size: 4096,
        basename: "spreadsheet.xlsx",
        lastModified: new Date("2023-08-10T08:30:00Z"),
        policy: "private"
    },
    {
        kind: "file",
        size: 20480,
        basename: "photo.jpg",
        lastModified: new Date("2024-03-12T15:40:00Z"),
        policy: "public"
    }
];
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
