import type { Thunks } from "core/bootstrap";
import { Evt } from "evt";
import { name, actions } from "./state";
import { privateSelectors } from "./selectors";
import * as projectManagement from "core/usecases/projectManagement";

export const thunks = {
    setActive:
        () =>
        (...args) => {
            const [dispatch, getState, { evtAction }] = args;

            {
                const isDisabledOnInstance =
                    privateSelectors.isDisabledOnInstance(getState());

                if (isDisabledOnInstance) {
                    return {
                        setInactive: () => {}
                    };
                }
            }

            const ctx = Evt.newCtx();

            evtAction
                .pipe(
                    ctx,
                    action =>
                        action.usecaseName === "viewQuotas" &&
                        action.actionName === "quotasDisabled"
                )
                .attachOnce(() => ctx.done());

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

            // TODO: Update, it isn't smart.
            evtAction.attach(
                action =>
                    action.usecaseName === "serviceManagement" &&
                    action.actionName === "helmReleaseLocked" &&
                    (action.payload.reason === "delete" ||
                        action.payload.reason === "suspend"),
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

                    if (ctx.completionStatus !== undefined) {
                        break;
                    }

                    try {
                        await dispatch(thunks.update());
                    } catch {
                        console.log("Fetching of quotas failed");
                    }
                }
            })();

            return {
                setInactive: () => {
                    ctx.done();
                }
            };
        },
    update:
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

            if (quotas === undefined) {
                dispatch(actions.quotasDisabled());
                return;
            }

            dispatch(
                actions.updateCompleted({
                    quotas,
                    projectId:
                        projectManagement.protectedSelectors.currentProject(getState())
                            .id,
                    quotaWarningThresholdPercent:
                        paramsOfBootstrapCore.quotaWarningThresholdPercent,
                    quotaCriticalThresholdPercent:
                        paramsOfBootstrapCore.quotaCriticalThresholdPercent
                })
            );
        },
    toggleIsOnlyNonNegligibleQuotas:
        () =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.isOnlyNonNegligibleQuotasToggled());
        }
} satisfies Thunks;
