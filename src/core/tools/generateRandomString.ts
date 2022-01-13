export function generateRandomString() {
    return Array(2)
        .fill("")
        .map(() => Math.random().toString(36).slice(-10))
        .join("")
        .replace(/\./g, "");
}
