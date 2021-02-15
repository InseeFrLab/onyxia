

import { Evt } from "evt";
import { useEvt, useRerenderOnStateChange } from "evt/hooks";

export function useWindowInnerSize() {

    const evtInnerWidth = useEvt(ctx =>
        Evt.from(ctx, window, "resize")
            .toStateful()
            .pipe(() => [{
                "windowInnerWidth": window.innerWidth,
                "windowInnerHeight": window.innerHeight
            }]),
        []
    );

    useRerenderOnStateChange(evtInnerWidth);

    return evtInnerWidth.state;

}

