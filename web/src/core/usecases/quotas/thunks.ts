import type { Thunks } from "core/bootstrap";
import { Evt } from "evt";
import { name, actions } from "./state";

export const thunks = {
    "setActive":
        () =>
        (...args) => {
            const [dispatch, , { evtAction }] = args;

            const ctx = Evt.newCtx();

            evtAction
                .pipe(
                    ctx,
                    action =>
                        action.usecaseName === "projectManagement" &&
                        action.actionName === "projectChanged"
                )
                .toStateful()
                .attach(() => dispatch(privateThunks.update()));

            const timer = setInterval(() => dispatch(privateThunks.update()), 20_000);

            function setInactive() {
                ctx.done();
                clearInterval(timer);
            }

            return { setInactive };
        }
} satisfies Thunks;

export const privateThunks = {
    "update":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi }] = args;

            {
                const state = getState()[name];

                if (state.isUpdating) {
                    return;
                }
            }

            dispatch(actions.updateStarted());

            const quotas = await onyxiaApi.getQuotas();

            dispatch(
                actions.updateCompleted({
                    quotas
                })
            );
        }
} satisfies Thunks;
