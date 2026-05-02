import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name } from "./state";
import { privateSelectors } from "./selectors";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { same } from "evt/tools/inDepth/same";
import { privateThunks } from "./thunks";

export const createEvt = (({ evtAction, dispatch, getState }) => {
    evtAction
        .pipe(action => action.usecaseName === name)
        .pipe(() => [
            {
                s3Uri: privateSelectors.s3Uri(getState()),
                isPublic: privateSelectors.isPublic(getState()),
                validityDuration: privateSelectors.validityDuration(getState())
            }
        ])
        .pipe(onlyIfChanged({ areEqual: same }))
        .attach(() => dispatch(privateThunks.updateHttpUrl()));

    return Evt.create<void>();
}) satisfies CreateEvt;
