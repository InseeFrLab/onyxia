export function timeAgo(unixTimestampMs: number): string {
    const msPerSecond = 1000;
    const msPerMinute = 60 * 1000;
    const msPerHour = 60 * 60 * 1000;
    const msPerDay = 24 * 60 * 60 * 1000;

    const now = new Date().getTime();
    const elapsed = now - unixTimestampMs;

    if (elapsed < msPerMinute) {
        const seconds = Math.round(elapsed / msPerSecond);
        return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
    } else if (elapsed < msPerHour) {
        const minutes = Math.round(elapsed / msPerMinute);
        return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (elapsed < msPerDay) {
        const hours = Math.round(elapsed / msPerHour);
        return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
        const days = Math.round(elapsed / msPerDay);
        return `${days} day${days > 1 ? "s" : ""} ago`;
    }
}
