import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";

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
    };
}

export const name = "quotas";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": id<State>(
        id<State.NotInitialized>({
            "stateDescription": "not initialized",
            "isUpdating": false
        })
    ),
    "reducers": {
        "updateStarted": state => {
            state.isUpdating = true;
        },
        "updateCompleted": (
            _state,
            {
                payload
            }: {
                payload: {
                    quotas: Record<string, Record<"spec" | "usage", string | number>>;
                };
            }
        ) => {
            const { quotas } = payload;

            return id<State.Ready>({
                "stateDescription": "ready",
                "isUpdating": false,
                quotas
            });
        }
    }
});
