const thresh = 1000;
/** @param dp Number of decimal places to display. */
const dp = 1;

const units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"] as const;

type Unit = "B" | (typeof units)[number];

export function fileSizePrettyPrint(params: { bytes: number; unit?: Unit }): {
    value: string;
    unit: Unit;
} {
    let { bytes } = params;

    if (Math.abs(bytes) < thresh || params.unit === "B") {
        return {
            value: `${bytes}`,
            unit: "B"
        };
    }

    let u = -1;
    const r = 10 ** dp;

    let targetU = params.unit === undefined ? undefined : units.indexOf(params.unit);

    do {
        bytes /= thresh;
        ++u;
    } while (
        (targetU !== undefined && targetU > u) ||
        (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)
    );

    const unit = units[u];

    return {
        value: bytes.toFixed(dp),
        unit
    };
}

/*
console.log(
fileSizePrettyPrint({
    "bytes": 2_000,
    "unit": "B"
})
);

console.log(
fileSizePrettyPrint({
    "bytes": 2_000,
    "unit": "kB"
})
);

console.log(
fileSizePrettyPrint({
    "bytes": 100_000,
    "unit": "MB"
})
);

console.log(
fileSizePrettyPrint({
    "bytes": 100_000,
    "unit": "GB"
})
);
*/
