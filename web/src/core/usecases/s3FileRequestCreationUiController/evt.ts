import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name } from "./state";
import { privateThunks } from "./thunks";

export const createEvt = (({ evtAction, dispatch }) => {
    evtAction
        .pipe(action => {
            if (action.usecaseName !== name) {
                return false;
            }

            switch (action.actionName) {
                case "loaded":
                case "validityDurationChanged":
                case "maxObjectSizeChanged":
                    return true;
                case "generationStarted":
                case "generationSucceeded":
                case "generationFailed":
                    return false;
            }
        })
        .attach(() => dispatch(privateThunks.updatePresignedPost()));

    return Evt.create<void>();
}) satisfies CreateEvt;
