import type { DirectoryItem, Item } from "./types";

export const isDirectory = (item: Item): item is DirectoryItem =>
    item.kind === "directory";
