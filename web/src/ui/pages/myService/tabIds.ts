export const tabIds = ["logs", "values"] as const;

export type TabIds = (typeof tabIds)[number];
