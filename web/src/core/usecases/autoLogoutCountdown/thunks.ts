import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { assert } from "tsafe/assert";

export const thunks = {
    setActive:
        () =>
        (...args) => {
            const [dispatch, , { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            const { unsubscribeFromAutoLogoutState } = oidc.subscribeToAutoLogoutState(
                ({ shouldDisplayWarning, secondsLeftBeforeAutoLogout }) => {
                    dispatch(
                        actions.secondsLeftSet({
                            secondsLeft: shouldDisplayWarning
                                ? secondsLeftBeforeAutoLogout
                                : undefined
                        })
                    );
                }
            );

            const setInactive = () => {
                unsubscribeFromAutoLogoutState();
            };

            return { setInactive };
        }
} satisfies Thunks;
