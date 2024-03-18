export const tabIds = ["logs", "events", "env"] as const;

export type TabIds = (typeof tabIds)[number];
