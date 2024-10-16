import type { Directory, Item } from "./types";

export const isDirectory = (item: Item): item is Directory => item.kind === "directory";
