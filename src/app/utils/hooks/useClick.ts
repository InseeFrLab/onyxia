


import type React from "react";
import { useState } from "react";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { id } from "evt/tools/typeSafety/id";
import memoize from "memoizee";

export type ReactMouseEvent = React.MouseEvent<HTMLElement, MouseEvent>;

type OnMouseUpOrDown = (mouseEvent: ReactMouseEvent) => void;

/**
 * Why not use onDoubleClick? 
 * Because it down is fired event when a double click is pending.
 */
export function useClick<ExtraArg>(
    params: {
        doubleClickDelayMs: number;
        /** Use useCallback, the ref should not be different at each render */
        callback(params: {
            type: "down" | "double";
            mouseEvent: ReactMouseEvent;
            extraArg: ExtraArg;
        }): void;
    }
) {

    const { doubleClickDelayMs, callback } = params;

    const [{
        evtMouseUpOrDown,
        getOnMouseProps
    }] = useState(() => {

        const evtMouseUpOrDown = Evt.create<{
            type: "up" | "down",
            mouseEvent: ReactMouseEvent;
            extraArg: ExtraArg;
        }>();

        return {
            evtMouseUpOrDown,
            "getOnMouseProps": memoize((extraArg: ExtraArg) => ({
                "onMouseDown": id<OnMouseUpOrDown>(
                    mouseEvent => { 
                        evtMouseUpOrDown.post({ "type": "down", mouseEvent, extraArg });
                    }
                ),
                "onMouseUp": id<OnMouseUpOrDown>(
                    mouseEvent => {
                        evtMouseUpOrDown.post({ "type": "up", mouseEvent, extraArg });
                    }
                )
            }))
        };

    });

    //NOTE: We wrap in useEvt for update when double click delay is changed
    const { evtDownOrDouble } = useEvt(
        ctx => {

            const evtDownOrDouble = Evt.create<{
                type: "down" | "double";
                mouseEvent: ReactMouseEvent;
                extraArg: ExtraArg;
            }>();

            evtMouseUpOrDown
                .pipe(
                    ctx,
                    ({ type, mouseEvent, extraArg }) => type !== "down" ?
                        null : [{ "now": Date.now(), mouseEvent, extraArg }]
                )
                .pipe([
                    ({ mouseEvent, now, extraArg }, prev) => [{
                        now,
                        "isPendingDouble": (now - prev.now) < doubleClickDelayMs,
                        mouseEvent,
                        extraArg
                    }],
                    {
                        "now": 0,
                        "isPendingDouble": false,
                        "mouseEvent": null as any as ReactMouseEvent,
                        "extraArg": null as any as ExtraArg
                    }

                ])
                .attachExtract(
                    ({ isPendingDouble }) => isPendingDouble,
                    ({ mouseEvent, extraArg }) => {
                        //NOTE: Prevent text selection on double click: 
                        //https://stackoverflow.com/a/55617595/3731798
                        mouseEvent.preventDefault();

                        evtMouseUpOrDown.attachOnce(
                            ({ type }) => type === "up",
                            ctx,
                            ({ mouseEvent }) => evtDownOrDouble.post({
                                "type": "double",
                                mouseEvent,
                                extraArg
                            })
                        );

                    }
                )
                .attach(({ mouseEvent, extraArg }) =>
                    evtDownOrDouble.post({
                        "type": "down",
                        mouseEvent,
                        extraArg
                    })
                );

            return { evtDownOrDouble };

        },
        [doubleClickDelayMs, evtMouseUpOrDown]
    );

    //NOTE: We don't want to loose the state when the callback is
    //changed so we use a separate useEvt
    useEvt(
        ctx => evtDownOrDouble.attach(
            ctx,
            ({ type, mouseEvent, extraArg }) =>
                callback({ type, mouseEvent, extraArg })
        ),
        [callback]
    );

    return { getOnMouseProps };

}