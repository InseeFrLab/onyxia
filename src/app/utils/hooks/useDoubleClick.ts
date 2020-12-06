

import { useState, useCallback } from "react";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";

export function useDoubleClick(
    params: { onClick(params: { type: "simple" | "double" }): void; }
) {

    const { onClick } = params;

    const [evtClick] = useState(() => Evt.create())

    useEvt(
        ctx => {

            evtClick.pipe(
                ctx,
                [
                    (_, prev) => [{ "then": prev.now, "now": Date.now() }],
                    ({ "then": NaN, "now": 0 })
                ]
            ).attach(
                ({ then, now }) =>
                    onClick({ "type": now - then < 300 ? "double" : "simple" })
            );

        },
        [evtClick, onClick]
    );


    const onClickProxy = useCallback(
        () => evtClick.post(),
        [evtClick]
    );

    return { onClickProxy }

}