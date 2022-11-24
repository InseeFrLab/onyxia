export const accountTabIds = [
    "infos",
    "third-party-integration",
    "storage",
    "user-interface",
    "k8sCredentials",
    "vault"
] as const;

export type AccountTabId = typeof accountTabIds[number];
