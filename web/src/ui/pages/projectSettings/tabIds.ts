export const tabIds = ["s3-configs", "security-info"] as const;

export type TabId = (typeof tabIds)[number];
