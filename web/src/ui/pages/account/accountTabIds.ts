export const accountTabIds = [
    "profile",
    "git",
    "storage",
    "k8sCodeSnippets",
    "vault",
    "user-interface"
] as const;

export type AccountTabId = (typeof accountTabIds)[number];
