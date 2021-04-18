
export const accountTabIds = ["account-info", "third-party-integration", "storage", "user-interface" ] as const;

export type AccountTabId = typeof accountTabIds[number];