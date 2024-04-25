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
                .attach(async () => {
                    try {
                        await dispatch(thunks.update());
                    } catch {
                        console.log("Initial fetching of quotas failed");
                    }
                });

            evtAction.attach(
                action =>
                    action.usecaseName === "serviceManagement" &&
                    (action.actionName === "serviceStopped" ||
                        (action.actionName === "suspendOrResumeServiceCompleted" &&
                            action.payload.isSuspended)),
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
                        const ctxInner = Evt.newCtx();

                        const timer = setTimeout(
                            () => {
                                ctxInner.done();
                                resolve();
                            },
                            isOngoingPodDeletion === true ? 4_000 : 30_000
                        );

                        ctx.evtDoneOrAborted.attachOnce(ctxInner, () =>
                            clearTimeout(timer)
                        );
                    });

                    try {
                        console.log("Fetching quotas");
                        await dispatch(thunks.update());
                    } catch {
                        console.log("Fetching of quotas failed");
                    }
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
