import { useEffect, useId } from "react";

export function useApplyClassNameToParent(props: {
    parentSelector: string;
    className: string;
}): { childrenClassName: string } {
    const { className, parentSelector } = props;

    const childrenClassName = `ref-${useId().replace(/:/g, "-")}`;

    useEffect(() => {
        // Function to apply the class to the parent element
        const applyClassToParent = (element: Element) => {
            const parent = element.closest(parentSelector);
            if (parent) {
                parent.classList.add(className);
            }
        };

        // Process existing elements
        document.querySelectorAll(`.${childrenClassName}`).forEach(applyClassToParent);

        // Function to handle mutations
        const handleMutation = (mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if ((node as Element).classList?.contains(childrenClassName)) {
                            applyClassToParent(node as Element);
                        }
                    });
                }
            });
        };

        // Creating an observer instance
        const observer = new MutationObserver(handleMutation);

        // Options for the observer (which mutations to observe)
        const config = { childList: true, subtree: true };

        // Start observing the body for mutations
        observer.observe(document.body, config);

        // Cleanup function
        return () => observer.disconnect();
    }, [childrenClassName]);

    return { childrenClassName };
}
