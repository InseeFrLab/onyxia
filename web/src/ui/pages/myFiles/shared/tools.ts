import type { Item } from "./types";

export const isDirectory = (item: Item): item is Item.Directory =>
    item.kind === "directory";
