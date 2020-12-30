
import { useState, useEffect } from "react";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { arrDiff } from "evt/tools/reducers/diff";

export function useArrayDiff<ArrOf, WatchFor extends "addition" | "deletion">(
    params: {
        watchFor: WatchFor;
        array: ArrOf[],
        callback(
            params: {
                [Key in WatchFor extends "addition" ? "added" : "removed"]: ArrOf[];
            }
        ): void;
    }
) {

    const { array, callback } = params;

    const watchFor: "addition" | "deletion" = params.watchFor;

    const [evtArray] = useState(() => Evt.create(array));

    //NOTE: This should be called every render, do not put dep array.
    useEffect(() => { evtArray.state = [...array]; });

    useEvt(
        ctx => evtArray
            .evtDiff
            .pipe(ctx, ({ prevState, newState }) => [arrDiff(prevState, newState)])
            .pipe(({ removed, added }) => [(() => {
                switch (watchFor) {
                    case "addition": return added;
                    case "deletion": return removed;
                }
            })()])
            .pipe(arr => arr.length !== 0)
            .attach(arr => callback(
                (() => {
                    switch (watchFor) {
                        case "addition": return { "added": arr };
                        case "deletion": return { "removed": arr };
                    }
                })() as any
            ))
        ,
        [callback, evtArray, watchFor]
    );


}

