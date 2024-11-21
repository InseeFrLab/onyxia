import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";

export type State = State.NotInitialized | State.Ready;

export namespace State {
    export type Common = {
        isUpdating: boolean;
    };

    export type NotInitialized = Common & {
        stateDescription: "not initialized";
    };

    export type Ready = Common & {
        stateDescription: "ready";
        quotas: Record<string, Record<"spec" | "usage", string | number>>;
        projectId: string;
        isOngoingPodDeletion: boolean;
        isOnlyNonNegligibleQuotas: boolean;
        quotaWarningThresholdPercent: number;
        quotaCriticalThresholdPercent: number;
    };
}

export const name = "viewQuotas";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotInitialized>({
            stateDescription: "not initialized",
            isUpdating: false
        })
    ),
    reducers: {
        updateStarted: state => {
            state.isUpdating = true;
        },
        updateCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    quotas: Record<string, Record<"spec" | "usage", string | number>>;
                    quotaWarningThresholdPercent: number;
                    quotaCriticalThresholdPercent: number;
                    projectId: string;
                };
            }
        ) => {
            const {
                quotas,
                quotaWarningThresholdPercent,
                quotaCriticalThresholdPercent,
                projectId
            } = payload;

            return id<State.Ready>({
                stateDescription: "ready",
                isUpdating: false,
                quotas,
                projectId,
                isOngoingPodDeletion: (() => {
                    if (state.stateDescription === "not initialized") {
                        return false;
                    }

                    assert(state.stateDescription === "ready");

                    if (!state.isOngoingPodDeletion) {
                        return false;
                    }

                    return same([quotas, projectId], [state.quotas, state.projectId]);
                })(),
                isOnlyNonNegligibleQuotas: (() => {
                    if (state.stateDescription === "not initialized") {
                        return true;
                    }

                    assert(state.stateDescription === "ready");

                    return state.isOnlyNonNegligibleQuotas;
                })(),
                quotaWarningThresholdPercent,
                quotaCriticalThresholdPercent
            });
        },
        podDeletionStarted: state => {
            assert(state.stateDescription === "ready");
            state.isOngoingPodDeletion = true;
        },
        isOnlyNonNegligibleQuotasToggled: state => {
            assert(state.stateDescription === "ready");
            state.isOnlyNonNegligibleQuotas = !state.isOnlyNonNegligibleQuotas;
        }
    }
});
