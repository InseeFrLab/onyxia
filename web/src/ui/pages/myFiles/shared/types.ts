import type { CurrentWorkingDirectoryView } from "core/usecases/fileExplorer";

export type Item = CurrentWorkingDirectoryView.Item;
export type DirectoryItem = CurrentWorkingDirectoryView.Item.Directory;
export type FileItem = CurrentWorkingDirectoryView.Item.File;

export const viewModes = ["list", "block"] as const; //the order is important, first is the default for the router

export type ViewMode = (typeof viewModes)[number];
