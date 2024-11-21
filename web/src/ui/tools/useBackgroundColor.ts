import { useState, useEffect } from "react";

export function useBackgroundColor() {
    const TRANSPARENT = "rgba(0, 0, 0, 0)";

    const [backgroundColor, setBackgroundColor] = useState(TRANSPARENT);

    const [element, setElement] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (element === null) {
            return;
        }

        const backgroundColor = (function callee(element: HTMLElement) {
            const { backgroundColor } = window.getComputedStyle(element);

            if (backgroundColor === TRANSPARENT) {
                const parent = element.parentElement;

                if (parent === null) {
                    return backgroundColor;
                }

                return callee(parent);
            }

            return backgroundColor;
        })(element);

        setBackgroundColor(backgroundColor);
    }, [element]);

    return { backgroundColor, setElement };
}
