import { Deferred } from "evt/tools/Deferred";

export function createWaitForDebounce(params: { delay: number }) {
    const { delay } = params;

    let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

    function waitForDebounce(): Promise<void | never> {
        if (timeout !== undefined) {
            clearTimeout(timeout);
        }

        const d = new Deferred<void>();

        timeout = setTimeout(() => {
            d.resolve();
        }, delay);

        return d.pr;
    }

    return { waitForDebounce };
}
