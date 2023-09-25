import { Deferred } from "evt/tools/Deferred";

export function waitForDebounceFactory(params: { delay: number }) {
    const { delay } = params;

    let d: Deferred<void | never> | undefined = undefined;

    function waitForDebounce(): Promise<void | never> {
        if (d === undefined) {
            setTimeout(() => {
                d!.resolve();
                d = undefined;
            }, delay);
        }

        return (d = new Deferred()).pr;
    }

    return { waitForDebounce };
}
