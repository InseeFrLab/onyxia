export const accountTabIds = [
    "infos",
    "third-party-integration",
    "storage",
    "user-interface",
    "kubernetes",
] as const;

export type AccountTabId = typeof accountTabIds[number];
