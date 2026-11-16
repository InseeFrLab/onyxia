import { toBytes } from "core/tools/bytes";
import { assert } from "tsafe/assert";

export function computeQuotaUsageRatio(params: {
    used: string | number;
    total: string | number;
}): number | undefined {
    const { used, total } = params;

    if (typeof used !== typeof total) {
        console.warn(`Mismatched types: used=${used} total=${total}`);
        return undefined;
    }

    cpu_resource_unit: {
        if (typeof total !== "string") {
            break cpu_resource_unit;
        }

        assert(typeof used === "string");

        const cpuResourceUnit = /^(\d+)(m?)$/;

        if (!cpuResourceUnit.test(total)) {
            break cpu_resource_unit;
        }

        const parseCpuResourceUnit = (value: string) => {
            const match = value.match(cpuResourceUnit)!;

            const n = Number(match[1]);

            return match[2].toLowerCase() === "m" ? n / 1000 : n;
        };

        if (
            !total.endsWith("m") &&
            !used.endsWith("m") &&
            parseCpuResourceUnit(total) > 1024
        ) {
            break cpu_resource_unit;
        }

        if (!cpuResourceUnit.test(used)) {
            console.warn(`Invalid used: ${used} for total: ${total}`);
            return undefined;
        }

        return divideUsageByTotal(
            parseCpuResourceUnit(used),
            parseCpuResourceUnit(total)
        );
    }

    bytes: {
        if (typeof total !== "string") {
            break bytes;
        }

        assert(typeof used === "string");

        let totalBytes: number;
        let usedBytes: number;

        try {
            totalBytes = toBytes(total);
            usedBytes = toBytes(used);
        } catch (error) {
            console.warn(String(error));

            return undefined;
        }

        return divideUsageByTotal(usedBytes, totalBytes);
    }

    absolute_number: {
        if (typeof total !== "number") {
            break absolute_number;
        }

        assert(typeof used === "number");

        return divideUsageByTotal(used, total);
    }

    console.warn(`Unsupported quota unit: used=${used} total=${total}`);

    return undefined;
}

function divideUsageByTotal(used: number, total: number): number {
    if (total === 0) {
        // NOTE: A quota with a max of 0 (e.g. requests.nvidia.com/gpu: 0)
        // would otherwise yield NaN (0/0) or Infinity.
        return used === 0 ? 0 : 1;
    }

    return used / total;
}
