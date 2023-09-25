import "minimal-polyfills/Object.fromEntries";

export function JSONSortStringify(record: Record<string, unknown>) {
    return JSON.stringify(
        Object.fromEntries(
            Object.entries(record).sort(([key1], [key2]) => (key1 < key2 ? 1 : -1))
        )
    );
}
