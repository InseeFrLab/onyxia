import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerItems } from "./ExplorerItems";
import { Evt } from "evt";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyFiles/NewComponents/ExplorerItems/ExplorerItems",
    component: ExplorerItems
} satisfies Meta<typeof ExplorerItems>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isNavigating: false,
        files: ["file1.txt", "file2.txt"],
        directories: ["Documents", "Pictures"],
        directoriesBeingCreated: [],
        filesBeingCreated: [],
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
        files: [],
        directories: [],
        directoriesBeingCreated: [],
        filesBeingCreated: [],
        onNavigate: action("Navigate to directory"),
        onOpenFile: action("Open file"),
        onDeleteItem: action("Delete item"),
        onCopyPath: action("Copy path"),
        onSelectedItemKindValueChange: action("Selected item kind changed"),
        evtAction: Evt.create<"DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH">()
    }
};
