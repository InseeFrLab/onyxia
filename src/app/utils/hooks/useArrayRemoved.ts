
import { useState, useEffect } from "react";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { arrDiff } from "evt/tools/reducers/diff";

export function useArrayRemoved<ArrOf>(
    params: {
        array: ArrOf[],
        callback(removed: ArrOf[]): void;
    }
) {

    const { array, callback } = params;

    const [evtArray] = useState(() => Evt.create(array));

    //NOTE: This should be called every render, do not put dep array.
    useEffect(() => { evtArray.state = [...array]; });

    useEvt(
        ctx => evtArray
            .evtDiff
            .pipe(ctx, ({ prevState, newState }) => [arrDiff(prevState, newState).removed])
            .pipe(removed => removed.length !== 0)
            .attach(removed => callback([...removed])),
        [callback, evtArray]
    );


}


