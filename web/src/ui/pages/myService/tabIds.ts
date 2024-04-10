export const tabIds = ["logs", "env"] as const;

export type TabIds = (typeof tabIds)[number];
