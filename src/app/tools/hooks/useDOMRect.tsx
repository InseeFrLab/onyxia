
import React from "react";
import type { ReactNode } from "react";
import { useState, useRef, useContext, useEffect } from "react";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import ResizeObserver from "resize-observer-polyfill";
import { useWindowInnerSize } from "app/tools/hooks/useWindowInnerSize";
import { css, cx } from "app/tools/jssOnTopOfEmotionCss";
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

    const [htmlElement, setHtmlElement] =useState<T | null>(null);

    useEffect(
        () => { setHtmlElement(ref.current); },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [ref.current ?? {}]
    );

    const { referenceWidth } = useContext(zoomContext);

    useEvt(
        ctx => {

            if (htmlElement === null) {
                return;
            }

            Evt_fromObserver(ctx, ResizeObserver, htmlElement)
                .toStateful()
                .attach(
                    () => {

                        /*
                        const { ...boundingClientRect } = htmlElement.getBoundingClientRect();

                        if (referenceWidth !== undefined) {

                            (["bottom", "right", "top", "left", "height", "width"] as const)
                                .forEach(key => boundingClientRect[key] = (boundingClientRect[key] / ( window.innerWidth / referenceWidth)));

                        }

                        setDomRect(boundingClientRect);
                        */


                        const { bottom, right, top, left, height, width } = htmlElement.getBoundingClientRect();

                        if (referenceWidth === undefined) {

                            setDomRect({ bottom, right, top, left, height, width });

                        } else {

                            const factor= window.innerWidth / referenceWidth;

                            setDomRect({
                                "bottom": bottom / factor,
                                "right": right / factor,
                                "top": top / factor,
                                "left": left / factor,
                                "height": height / factor,
                                "width": width / factor
                            });

                        }

                    }
                );

        },
        [htmlElement, referenceWidth]
    );

    return { domRect, ref };

}

const zoomContext = React.createContext<{ referenceWidth?: number; }>({});

export type Props = {
    referenceWidth: number | undefined;
    children: ReactNode;
};

export function ZoomProvider(props: Props) {

    const { referenceWidth, children } = props;

    const { windowInnerWidth, windowInnerHeight } = useWindowInnerSize();

    if (referenceWidth === undefined) {
        return <>{children}</>;
    }

    const zoomFactor = windowInnerWidth / referenceWidth;

    return React.createElement(
        zoomContext.Provider,
        { "value": { referenceWidth } },
        <div className={cx("zoom-provider-out", css({
            "height": "100vh",
            "overflow": "hidden"
        }))}>
            <div className={cx("zoom-provider-in", css({
                "transform": `scale(${zoomFactor})`,
                "transformOrigin": "0 0",
                "width": referenceWidth,
                "height": windowInnerHeight / zoomFactor,
                "overflow": "hidden"
            }))}>
                {children}
            </div>
        </div>
    );


}
