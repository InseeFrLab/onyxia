export const accountTabIds = [
    "infos",
    "third-party-integration",
    "storage",
    "user-interface"
] as const;

export type AccountTabId = typeof accountTabIds[number];
