import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { Evt } from "evt";
import * as projectManagement from "core/usecases/projectManagement";

export const thunks = {
    "setActive":
        () =>
        (...args) => {
            const [dispatch, getState, { evtAction, onyxiaApi }] = args;

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

            function setInactive() {
                ctx.done();
            }

            return { setInactive };
        },
    "resetNotificationCount":
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            dispatch(
                actions.notificationCountReset({
                    "projectId": projectManagement.selectors.currentProject(getState()).id
                })
            );
        }
} satisfies Thunks;
