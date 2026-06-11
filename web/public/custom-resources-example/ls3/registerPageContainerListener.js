
/**
 * @param {string} routeName
 * @param {(element: HTMLElement) => void} listener
 */
export function registerPageContainerListener(routeName, listener) {

    /** @type {HTMLElement | undefined} */
    let element_cache = undefined;

    const update = () => {
        const element = document.getElementById(`page-container-${routeName}`);
        if (element === null) {
            return;
        }
        if (element === element_cache) {
            return;
        }
        element_cache = element;
        listener(element);
    };

    update();

    const observer = new MutationObserver(() => {
        update();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

}
