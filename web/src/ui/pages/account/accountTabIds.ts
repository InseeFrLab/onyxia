export const accountTabIds = [
    "profile",
    "git",
    "k8sCodeSnippets",
    "vault",
    "user-interface"
] as const;

export type AccountTabId = (typeof accountTabIds)[number];
