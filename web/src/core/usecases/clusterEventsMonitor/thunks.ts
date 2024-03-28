import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { Evt } from "evt";
import * as projectManagement from "core/usecases/projectManagement";
import { createUsecaseContextApi } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";

export const thunks = {
    "setActive":
        () =>
        (...args) => {
            const [dispatch, getState, rootContext] = args;

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
                        "onNewEvent": clusterEvent =>
                            dispatch(
                                actions.clusterEventReceived({
                                    "clusterEvent": clusterEvent,
                                    "projectId":
                                        projectManagement.selectors.currentProject(
                                            getState()
                                        ).id
                                })
                            )
                    });
                });

            let timer: ReturnType<typeof setTimeout> | undefined = undefined;

            function setInactive() {
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
    "resetNotificationCount":
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            dispatch(
                actions.notificationCheckedOut({
                    "projectId": projectManagement.selectors.currentProject(getState()).id
                })
            );
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    "restoreResentConnection": id<(() => { setInactive: () => void }) | undefined>(
        undefined
    )
}));
