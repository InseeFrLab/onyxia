import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";

export const name = "aiAccountUiController";

export type OperationState = "idle" | "pending" | "error";

export type State = {
    operationByProviderName: Record<string, OperationState>;
};

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        operationByProviderName: {}
    }),
    reducers: {
        providerOperationStarted: (
            state,
            { payload }: { payload: { providerName: string } }
        ) => {
            state.operationByProviderName[payload.providerName] = "pending";
        },
        providerOperationCompleted: (
            state,
            { payload }: { payload: { providerName: string; isSuccess: boolean } }
        ) => {
            state.operationByProviderName[payload.providerName] = payload.isSuccess
                ? "idle"
                : "error";
        }
    }
});
