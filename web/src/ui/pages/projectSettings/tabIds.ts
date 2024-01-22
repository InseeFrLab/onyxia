export const tabIds = ["security-info", "s3-configs"] as const;

export type TabId = (typeof tabIds)[number];
