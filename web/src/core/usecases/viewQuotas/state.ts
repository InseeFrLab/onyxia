import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { assert, type Equals } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";

export type State = State.NotInitialized | State.Ready | State.DisabledOnInstance;

export namespace State {
    export type Common = {
        isUpdating: boolean;
    };

    export type NotInitialized = Common & {
        stateDescription: "not initialized";
    };

    export type DisabledOnInstance = Common & {
        stateDescription: "disabled on instance";
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
            if (state.stateDescription === "disabled on instance") {
                return;
            }

            state.isUpdating = true;
        },
        quotasDisabled: () => {
            return id<State.DisabledOnInstance>({
                isUpdating: false,
                stateDescription: "disabled on instance"
            });
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

            assert(state.stateDescription !== "disabled on instance");

            return id<State.Ready>({
                stateDescription: "ready",
                isUpdating: false,
                quotas,
                projectId,
                isOngoingPodDeletion: (() => {
                    if (state.stateDescription === "not initialized") {
                        return false;
                    }

                    assert<Equals<typeof state.stateDescription, "ready">>;

                    if (!state.isOngoingPodDeletion) {
                        return false;
                    }

                    return same([quotas, projectId], [state.quotas, state.projectId]);
                })(),
                isOnlyNonNegligibleQuotas: (() => {
                    if (state.stateDescription === "not initialized") {
                        return true;
                    }

                    assert<Equals<typeof state.stateDescription, "ready">>;

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
