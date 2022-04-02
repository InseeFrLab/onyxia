const thresh = 1000;
/** @param dp Number of decimal places to display. */
const dp = 1;

export function fileSizePrettyPrint(bytes: number) {
    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }

    const units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

    const unit = units[u];

    return `${bytes.toFixed(dp)} ${unit}`;
}

console.log(fileSizePrettyPrint(200));
