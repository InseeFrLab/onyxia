export const accountTabIds = [
    "infos",
    "third-party-integration",
    "storage",
    "k8sCredentials",
    "vault",
    "user-interface"
] as const;

export type AccountTabId = typeof accountTabIds[number];
