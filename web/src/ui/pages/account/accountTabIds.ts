export const accountTabIds = [
    "profile",
    "git",
    "ai",
    "storage",
    "k8sCodeSnippets",
    "vault",
    "user-interface"
] as const;

export type AccountTabId = (typeof accountTabIds)[number];
