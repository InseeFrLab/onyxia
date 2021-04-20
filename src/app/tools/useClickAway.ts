
import { useRef } from "react";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import { useConstCallback } from "powerhooks";

//TODO: Move in powerhooks
export function useClickAway<T extends HTMLElement = any>(onClickAway: () => void) {

    const rootRef = useRef<T>(null);

    const onClickAway_const = useConstCallback(onClickAway);

    useEvt(
        ctx =>
            Evt.from(ctx, document, "mousedown")
                .attach(
                    ({ target }) => !rootRef.current?.contains(target as any),
                    onClickAway_const
                ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return { rootRef };

}
