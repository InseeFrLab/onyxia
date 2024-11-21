import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { assert } from "tsafe/assert";
import { name } from "./state";
import { id } from "tsafe/id";
import { exclude } from "tsafe/exclude";
import { computeQuotaUsageRatio } from "./decoupledLogic/computeQuotaUsageRatio";
import { arrPartition } from "evt/tools/reducers/partition";

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
    severity: "success" | "warning" | "error";
};

const allQuotas = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { quotas, quotaWarningThresholdPercent, quotaCriticalThresholdPercent } = state;

    return Object.keys(quotas)
        .map(name => {
            const { spec, usage } = quotas[name];

            const ratio = computeQuotaUsageRatio({
                used: usage,
                total: spec
            });

            if (ratio === undefined) {
                return undefined;
            }

            const usagePercentage = ratio * 100;

            return id<QuotaEntry>({
                name: name,
                used: `${usage}`,
                total: `${spec}`,
                usagePercentage,
                severity: (() => {
                    if (usagePercentage < quotaWarningThresholdPercent) {
                        return "success" as const;
                    }

                    if (usagePercentage < quotaCriticalThresholdPercent) {
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
                isReady: false as const
            };
        }

        assert(quotas !== undefined);
        assert(isOngoingPodDeletion !== undefined);
        assert(isOnlyNonNegligibleQuotas !== undefined);
        assert(totalQuotasCount !== undefined);

        return {
            isReady: true as const,
            quotas,
            isOngoingPodDeletion,
            isOnlyNonNegligibleQuotas,
            totalQuotasCount
        };
    }
);

const commandLogsEntry = createSelector(isReady, allQuotas, (isReady, quotas) => {
    if (!isReady) {
        return undefined;
    }

    assert(quotas !== undefined);

    const [limits, requests] = arrPartition(quotas, quota =>
        quota.name.startsWith("limits")
    )
        .map((quotas, i) =>
            i === 0
                ? quotas
                : [...quotas].sort((a, b) => {
                      const [aStartsWithRequests, bStartsWithRequests] = [a, b].map(
                          quota => quota.name.startsWith("requests.")
                      );

                      if (aStartsWithRequests && !bStartsWithRequests) {
                          return 1;
                      } else if (!aStartsWithRequests && bStartsWithRequests) {
                          return -1;
                      } else {
                          return 0;
                      }
                  })
        )
        .map(quotas =>
            quotas.map(({ name, used, total }) => `${name}: ${used}/${total}`).join(", ")
        );

    const requestWord = "REQUEST";

    return {
        cmdId: Date.now(),
        cmd: "kubectl get quota",
        resp:
            limits.length + requests.length > 130
                ? [requestWord, requests, "", "LIMIT", limits].join("\n")
                : [
                      `${requestWord}${new Array(requests.length - requestWord.length + 2).fill(" ").join("")}LIMIT`,
                      `${requests}  ${limits}`
                  ].join("\n")
    };
});

export const selectors = {
    main
};

export const privateSelectors = {
    isOngoingPodDeletion
};

export const protectedSelectors = {
    isOnlyNonNegligibleQuotas,
    commandLogsEntry
};
