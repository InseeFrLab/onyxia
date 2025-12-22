import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name } from "./state";
import { protectedThunks } from "./thunks";

export const createEvt = (({ evtAction, dispatch }) => {
    const evtOut = Evt.create<{
        action: "ask confirmation for bucket creation attempt";
        bucket: string;
        createBucket: () => Promise<{ isSuccess: boolean }>;
    }>();

    const evtUsecaseAction = evtAction.pipe(action => action.usecaseName === name);

    evtUsecaseAction.$attach(
        action =>
            action.actionName === "navigationCompleted" &&
            !action.payload.isSuccess &&
            action.payload.navigationError.errorCase === "no such bucket" &&
            action.payload.navigationError.shouldAttemptToCreate
                ? [action.payload.navigationError]
                : null,
        ({ bucket, directoryPath }) =>
            evtOut.post({
                action: "ask confirmation for bucket creation attempt",
                bucket,
                createBucket: () =>
                    dispatch(
                        protectedThunks.createBucket({
                            bucket,
                            directoryPath_toNavigateToOnSuccess: directoryPath
                        })
                    )
            })
    );

    return evtOut;
}) satisfies CreateEvt;
