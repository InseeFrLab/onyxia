

import { Evt } from "evt";
import { useEvt, useStatefulEvt } from "evt/hooks";

export function useWindowInnerWidth() {

    const evtInnerWidth = useEvt(ctx =>
        Evt.from(ctx, window, "resize")
            .toStateful()
            .pipe(() => [window.innerWidth])
        ,
        []
    );

    useStatefulEvt([evtInnerWidth]);

    return { "windowInnerWidth": evtInnerWidth.state };

}

