
import React, { useRef, useCallback } from "react";
import ReactResizeDetector from "react-resize-detector";

/** Just a proxy to ReactResizeDetector to avoid React strict mode warnings */
export const ResizeDetector: React.FC<{ onResize: (params: { width: number; }) => void; }> =
    ({ onResize }) => {

        const ref = useRef<HTMLDivElement>(null);

        return (
            <ReactResizeDetector
                handleWidth
                targetRef={ref}
                onResize={useCallback((width: number) => onResize({ width }), [onResize])}
            >
                <div ref={ref} />
            </ReactResizeDetector>
        );


    };


