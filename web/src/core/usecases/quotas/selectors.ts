import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { assert } from "tsafe/assert";
import { name } from "./state";
import { id } from "tsafe/id";
import { exclude } from "tsafe/exclude";
import { toBytes } from "core/tools/bytes";

const state = (rootState: RootState) => rootState[name];

function computeQuotaUsageRatio(params: {
    used: string | number;
    total: string | number;
}): number | undefined {
    const { used, total } = params;

    if (typeof used !== typeof total) {
        console.warn(`Mismatched types: used=${used} total=${total}`);
        return undefined;
    }

    cpu_resource_unit: {
        if (typeof used !== "string") {
            break cpu_resource_unit;
        }

        assert(typeof total === "string");

        const cpuResourceUnit = /^(\d+)(m?)$/;

        if (!cpuResourceUnit.test(used)) {
            break cpu_resource_unit;
        }

        if (!cpuResourceUnit.test(total)) {
            console.warn(`Invalid total: ${total} for used: ${used}`);
            return undefined;
        }

        const parseCpuResourceUnit = (value: string) => {
            const match = value.match(cpuResourceUnit)!;

            const n = Number(match[1]);

            return match[2] === "m" ? n / 1000 : n;
        };

        return parseCpuResourceUnit(used) / parseCpuResourceUnit(total);
    }

    bytes: {
        if (typeof used !== "string") {
            break bytes;
        }

        assert(typeof total === "string");

        let usedBytes: number;
        let totalBytes: number;

        try {
            usedBytes = toBytes(used);
            totalBytes = toBytes(total);
        } catch (error) {
            console.warn(String(error));

            return undefined;
        }

        return usedBytes / totalBytes;
    }

    absolute_number: {
        if (typeof used !== "number") {
            break absolute_number;
        }

        assert(typeof total === "number");

        return used / total;
    }

    console.warn(`Unsupported quota unit: used=${used} total=${total}`);

    return undefined;
}

const readyState = createSelector(state, state => {
    if (state.stateDescription !== "ready") {
        return undefined;
    }

    return state;
});

const isReady = createSelector(state, state => state.stateDescription === "ready");

type QuotaEntry = {
    name: string;
    used: string;
    total: string;
    usagePercentage: number;
};

const quotas = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { quotas } = state;

    return Object.keys(quotas)
        .map(name => {
            const { spec, usage } = quotas[name];

            const ratio = computeQuotaUsageRatio({ "used": usage, "total": spec });

            if (ratio === undefined) {
                return undefined;
            }

            return id<QuotaEntry>({
                name,
                "used": `${usage}`,
                "total": `${spec}`,
                "usagePercentage": Math.round(ratio * 100)
            });
        })
        .filter(exclude(undefined));
});

const nonNegligibleQuotas = createSelector(isReady, quotas, (isReady, quotas) => {
    if (!isReady) {
        return undefined;
    }
    assert(quotas !== undefined);

    return quotas.filter(quota => quota.usagePercentage > 10);
});

const main = createSelector(
    isReady,
    quotas,
    nonNegligibleQuotas,
    (isReady, quotas, nonNegligibleQuotas) => {
        if (!isReady) {
            return {
                "isReady": false as const
            };
        }

        assert(quotas !== undefined);
        assert(nonNegligibleQuotas !== undefined);

        return {
            "isReady": true as const,
            quotas,
            nonNegligibleQuotas
        };
    }
);

export const selectors = {
    main
};
