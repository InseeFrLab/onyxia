import type { Thunks } from "core/bootstrap";
import { Evt } from "evt";
import { name, actions } from "./state";
import { privateSelectors } from "./selectors";
import * as projectManagement from "core/usecases/projectManagement";

export const thunks = {
    "setActive":
        () =>
        (...args) => {
            const [dispatch, getState, { evtAction }] = args;

            const ctx = Evt.newCtx();

            evtAction
                .pipe(
                    ctx,
                    action =>
                        action.usecaseName === "projectManagement" &&
                        action.actionName === "projectChanged"
                )
                .toStateful()
                .attach(() => {
                    dispatch(thunks.update());
                });

            evtAction.attach(
                action =>
                    action.usecaseName === "serviceManagement" &&
                    action.actionName === "serviceStopped",
                ctx,
                () => {
                    dispatch(actions.podDeletionStarted());
                }
            );

            (async () => {
                while (true) {
                    const isOngoingPodDeletion =
                        privateSelectors.isOngoingPodDeletion(getState());

                    await new Promise<void>(resolve => {
                        const timer = setTimeout(
                            resolve,
                            isOngoingPodDeletion === true ? 4_000 : 30_000
                        );

                        ctx.evtDoneOrAborted.attachOnce(() => clearTimeout(timer));
                    });

                    await dispatch(thunks.update());
                }
            })();

            function setInactive() {
                ctx.done();
            }

            return { setInactive };
        },
    "update":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi, paramsOfBootstrapCore }] = args;

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
                    quotas,
                    "projectId":
                        projectManagement.selectors.currentProject(getState()).id,
                    "quotaWarningThresholdPercent":
                        paramsOfBootstrapCore.quotaWarningThresholdPercent,
                    "quotaCriticalThresholdPercent":
                        paramsOfBootstrapCore.quotaCriticalThresholdPercent
                })
            );
        },
    "toggleIsOnlyNonNegligibleQuotas":
        () =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.isOnlyNonNegligibleQuotasToggled());
        }
} satisfies Thunks;
