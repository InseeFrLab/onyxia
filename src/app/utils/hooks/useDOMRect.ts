
import { useState, useRef } from "react";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import ResizeObserver from "resize-observer-polyfill";


import type { Ctx } from "evt";

function Evt_fromObserver(
    ctx: Ctx<any>,
    ObserverConstructor: typeof ResizeObserver,
    target: HTMLElement
): Evt<void> {

    const evt = Evt.create();

    const listener = () => evt.post();

    const observer = new ObserverConstructor(listener);

    observer.observe(target);

    ctx.evtDoneOrAborted.attachOnce(
        () => observer.disconnect()
    );

    return evt;

}



export type PartialDomRect = Pick<DOMRectReadOnly, "bottom" | "right" | "top" | "left" | "height" | "width">;

// https://gist.github.com/morajabi/523d7a642d8c0a2f71fcfa0d8b3d2846
// https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
export function useDOMRect<T extends HTMLElement = any>() {

    const ref = useRef<T>(null);

    const [domRect, setDomRect] = useState<PartialDomRect>({
        "bottom": 0,
        "right": 0,
        "top": 0,
        "left": 0,
        "height": 0,
        "width": 0
    });

    useEvt(
        ctx => {

            const htmlElement = ref.current;

            if (htmlElement === null) {
                return;
            }

            Evt_fromObserver(ctx, ResizeObserver, htmlElement)
                .toStateful()
                .attach(
                    () =>
                        setDomRect(
                            htmlElement.getBoundingClientRect()
                        )
                );

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [ref.current]
    );

    return { domRect, ref };

}