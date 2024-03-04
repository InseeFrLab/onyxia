import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { assert } from "tsafe/assert";
import { name } from "./state";
import { id } from "tsafe/id";
import { exclude } from "tsafe/exclude";
import { computeQuotaUsageRatio } from "./utils/computeQuotaUsageRatio";

const state = (rootState: RootState) => rootState[name];

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
    severity: "success" | "info" | "warning" | "error";
};

const allQuotas = createSelector(readyState, state => {
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

            const usagePercentage = ratio * 100;

            return id<QuotaEntry>({
                "name": name,
                "used": `${usage}`,
                "total": `${spec}`,
                usagePercentage,
                "severity": (() => {
                    if (usagePercentage < 25) {
                        return "success" as const;
                    }

                    if (usagePercentage < 50) {
                        return "info" as const;
                    }

                    if (usagePercentage < 75) {
                        return "warning" as const;
                    }

                    return "error" as const;
                })()
            });
        })
        .filter(exclude(undefined));
});

const isOnlyNonNegligibleQuotas = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.isOnlyNonNegligibleQuotas;
});

const quotas = createSelector(
    isReady,
    allQuotas,
    isOnlyNonNegligibleQuotas,
    (isReady, allQuotas, isOnlyNonNegligibleQuotas) => {
        if (!isReady) {
            return undefined;
        }

        assert(allQuotas !== undefined);
        assert(isOnlyNonNegligibleQuotas !== undefined);

        return !isOnlyNonNegligibleQuotas
            ? allQuotas
            : allQuotas.filter(quota => quota.severity !== "success");
    }
);

const totalQuotasCount = createSelector(isReady, allQuotas, (isReady, allQuotas) => {
    if (!isReady) {
        return undefined;
    }
    assert(allQuotas !== undefined);

    return allQuotas.length;
});

const isOngoingPodDeletion = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.isOngoingPodDeletion;
});

const main = createSelector(
    isReady,
    quotas,
    isOngoingPodDeletion,
    isOnlyNonNegligibleQuotas,
    totalQuotasCount,
    (
        isReady,
        quotas,
        isOngoingPodDeletion,
        isOnlyNonNegligibleQuotas,
        totalQuotasCount
    ) => {
        if (!isReady) {
            return {
                "isReady": false as const
            };
        }

        assert(quotas !== undefined);
        assert(isOngoingPodDeletion !== undefined);
        assert(isOnlyNonNegligibleQuotas !== undefined);
        assert(totalQuotasCount !== undefined);

        return {
            "isReady": true as const,
            quotas,
            isOngoingPodDeletion,
            isOnlyNonNegligibleQuotas,
            totalQuotasCount
        };
    }
);

export const selectors = {
    main
};

export const privateSelectors = {
    isOngoingPodDeletion
};
