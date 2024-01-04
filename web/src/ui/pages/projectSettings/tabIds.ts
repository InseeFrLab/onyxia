export const tabIds = ["security info"] as const;

export type TabId = (typeof tabIds)[number];
