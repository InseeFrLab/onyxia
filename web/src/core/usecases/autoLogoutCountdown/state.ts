import { id } from "tsafe/id";
import { createUsecaseActions } from "clean-architecture";

export type State = {
    secondsLeft: number | undefined;
};

export const name = "autoLogoutCountdown";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        secondsLeft: undefined
    }),
    reducers: {
        secondsLeftSet: (
            state,
            { payload }: { payload: { secondsLeft: number | undefined } }
        ) => {
            const { secondsLeft } = payload;

            state.secondsLeft = secondsLeft;
        }
    }
});
