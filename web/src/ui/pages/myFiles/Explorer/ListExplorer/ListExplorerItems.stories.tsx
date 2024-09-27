import type { Meta, StoryObj } from "@storybook/react";
import { ListExplorerItems } from "./ListExplorerItems";

const meta = {
    title: "Pages/MyFiles/Explorer/ListExplorerItems",
    component: ListExplorerItems
} satisfies Meta<typeof ListExplorerItems>;

export default meta;

type Story = StoryObj<typeof meta>;

const objects: ListExplorerItems["objects"] = [
    {
        kind: "file",
        size: 2048,
        name: "document.pdf",
        lastModified: new Date("2023-09-14T10:34:00Z"),
        policy: "public"
    },
    {
        kind: "directory",
        size: 4096,
        name: "photos",
        lastModified: new Date("2024-01-05T15:20:30Z"),
        policy: "private"
    },
    {
        kind: "file",
        size: 1048576,
        name: "video.mp4",
        lastModified: new Date("2023-12-01T08:12:45Z"),
        policy: "diffusion"
    },
    {
        kind: "directory",
        size: 8192,
        name: "projects",
        lastModified: new Date("2024-07-20T14:05:00Z"),
        policy: "private"
    },
    {
        kind: "file",
        size: 512,
        name: "notes.txt",
        lastModified: new Date("2024-09-10T11:42:25Z"),
        policy: "public"
    },
    {
        kind: "file",
        size: 12345,
        name: "presentation.pptx",
        lastModified: new Date("2023-06-20T09:15:00Z"),
        policy: "public"
    },
    {
        kind: "file",
        size: 789456,
        name: "music.mp3",
        lastModified: new Date("2023-11-11T12:45:00Z"),
        policy: "diffusion"
    },
    {
        kind: "directory",
        size: 20480,
        name: "archive",
        lastModified: new Date("2022-10-03T17:00:00Z"),
        policy: "private"
    },
    {
        kind: "file",
        size: 500,
        name: "readme.md",
        lastModified: new Date("2024-02-15T10:00:00Z"),
        policy: "public"
    },
    {
        kind: "directory",
        size: 10240,
        name: "backup",
        lastModified: new Date("2024-05-05T14:22:00Z"),
        policy: "private"
    },
    {
        kind: "file",
        size: 4096,
        name: "spreadsheet.xlsx",
        lastModified: new Date("2023-08-10T08:30:00Z"),
        policy: "diffusion"
    },
    {
        kind: "file",
        size: 20480,
        name: "photo.jpg",
        lastModified: new Date("2024-03-12T15:40:00Z"),
        policy: "public"
    }
];
export const Default: Story = {
    args: { objects }
};
