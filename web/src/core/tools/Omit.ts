// TODO: Move in tsafe
export type Omit<T extends Record<string, unknown>, K extends keyof T> = {
    [P in Exclude<keyof T, K>]: T[P];
};
