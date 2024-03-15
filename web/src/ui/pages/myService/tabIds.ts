export const tabIds = ["tasks", "events", "values"] as const;

export type TabIds = (typeof tabIds)[number];
