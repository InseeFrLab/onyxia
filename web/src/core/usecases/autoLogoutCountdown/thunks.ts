import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { assert } from "tsafe/assert";
import { privateSelectors } from "./selectors";

export const thunks = {
    setActive:
        (params: { countdownStartsAtSecondsLeft: number }) =>
        (...args) => {
            const { countdownStartsAtSecondsLeft } = params;

            const [dispatch, getState, { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            const { unsubscribeFromAutoLogoutCountdown } =
                oidc.subscribeToAutoLogoutCountdown(({ secondsLeft }) => {
                    const currentSecondsLeft = privateSelectors.secondsLeft(getState());

                    const newSecondsLeft =
                        secondsLeft === undefined ||
                        secondsLeft > countdownStartsAtSecondsLeft
                            ? undefined
                            : secondsLeft;

                    if (currentSecondsLeft === newSecondsLeft) {
                        return;
                    }

                    dispatch(
                        actions.secondsLeftSet({
                            secondsLeft: newSecondsLeft
                        })
                    );
                });

            const setInactive = () => {
                unsubscribeFromAutoLogoutCountdown();
            };

            return { setInactive };
        }
} satisfies Thunks;
