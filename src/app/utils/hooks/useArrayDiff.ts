
import { useState, useEffect } from "react";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { arrDiff } from "evt/tools/reducers/diff";

export type UseArrayDiffCallbackParams<ArrOf> = {
    added: ArrOf[];
    removed: ArrOf[];
};

/** NOTE: It is best for performance that the ref of the callback
 * be updated as few as possible ( use useCallback() ) */
export function useArrayDiff<ArrOf>(
    params: {
        watchFor: "addition";
        array: ArrOf[],
        callback(params: Pick<UseArrayDiffCallbackParams<ArrOf>, "added">): void;
    }
): void;
export function useArrayDiff<ArrOf>(
    params: {
        watchFor: "deletion";
        array: ArrOf[],
        callback(params: Pick<UseArrayDiffCallbackParams<ArrOf>, "removed">): void;
    }
): void;
export function useArrayDiff<ArrOf>(
    params: {
        watchFor: "addition or deletion";
        array: ArrOf[],
        callback(params: UseArrayDiffCallbackParams<ArrOf>): void;
    }
): void;
export function useArrayDiff<ArrOf>(
    params: {
        watchFor?: "addition" | "deletion" | "addition or deletion";
        array: ArrOf[],
        callback(params: UseArrayDiffCallbackParams<ArrOf>): void;
    }
): void {

    const { watchFor, array, callback } = params


    const [evtArray] = useState(() => Evt.create(array));

    //NOTE: This should be called every render, do not put dep array.
    useEffect(() => { evtArray.state = [...array]; });

    useEvt(
        ctx => evtArray
            .evtDiff
            .pipe(ctx, ({ prevState, newState }) => [arrDiff(prevState, newState)])
            .pipe(({ removed, added }) => (
                removed.length !== 0 ||
                added.length !== 0
            ))
            .attach(({ added, removed }) => {

                switch (watchFor) {
                    case "addition":
                        if (added.length === 0) {
                            return;
                        }
                        break;
                    case "deletion":
                        if (removed.length === 0) {
                            return;
                        }
                        break;
                    case "addition or deletion":
                        break;
                }

                callback({
                    "added": [...added],
                    "removed": [...removed]
                });


            })
        ,
        [callback, evtArray, watchFor]
    );


}
