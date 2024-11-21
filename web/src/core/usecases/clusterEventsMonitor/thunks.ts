import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { Evt } from "evt";
import * as projectManagement from "core/usecases/projectManagement";
import { createUsecaseContextApi } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { selectors } from "./selectors";

export const thunks = {
    setActive:
        () =>
        (...args) => {
            const [dispatch, getState, rootContext] = args;

            dispatch(actions.enteredActiveState());

            const { evtAction, onyxiaApi } = rootContext;

            const context = getContext(rootContext);

            if (context.restoreResentConnection !== undefined) {
                const { setInactive } = context.restoreResentConnection();

                return { setInactive };
            }

            const ctx = Evt.newCtx();

            const evtUnsubscribe = Evt.create<void>();

            ctx.evtDoneOrAborted.attachOnce(() => evtUnsubscribe.post());

            evtAction
                .pipe(
                    ctx,
                    action =>
                        action.usecaseName === "projectManagement" &&
                        action.actionName === "projectChanged"
                )
                .toStateful()
                .attach(() => {
                    evtUnsubscribe.post();

                    onyxiaApi.subscribeToClusterEvents({
                        evtUnsubscribe,
                        onNewEvent: clusterEvent => {
                            if (
                                selectors
                                    .clusterEvents(getState())
                                    .find(
                                        ({ eventId }) => clusterEvent.eventId === eventId
                                    ) !== undefined
                            ) {
                                return;
                            }

                            if (clusterEvent.message.includes("probe failed:")) {
                                clusterEvent.severity = "info";
                            }

                            if (
                                clusterEvent.message.includes(
                                    "pod has unbound immediate PersistentVolumeClaims"
                                )
                            ) {
                                clusterEvent.severity = "info";
                            }

                            dispatch(
                                actions.newClusterEventReceived({
                                    clusterEvent: clusterEvent,
                                    projectId:
                                        projectManagement.protectedSelectors.currentProject(
                                            getState()
                                        ).id
                                })
                            );
                        }
                    });
                });

            let timer: ReturnType<typeof setTimeout> | undefined = undefined;

            function setInactive() {
                dispatch(actions.exitedActiveState());

                // NOTE: We do that because react in safe mode will call the effect multiple times
                // on top of that, we would like to avoid making another request to the server if the user
                // quickly navigate to another page then come back.
                timer = setTimeout(() => {
                    context.restoreResentConnection = undefined;
                    ctx.done();
                }, 5_000);
            }

            context.restoreResentConnection = () => {
                assert(
                    timer !== undefined,
                    "Should call setInactive before calling setActive again"
                );

                clearTimeout(timer);

                return { setInactive };
            };

            return { setInactive };
        },
    resetNotificationCount:
        () =>
        async (...args) => {
            const [dispatch] = args;

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "clusterNotificationCheckoutTime",
                    value: Date.now()
                })
            );
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    restoreResentConnection: id<(() => { setInactive: () => void }) | undefined>(
        undefined
    )
}));
