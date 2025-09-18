const valueByPromise = new WeakMap<Promise<unknown>, unknown>();
const setOfProcessedPromises = new WeakSet<Promise<unknown>>();

/** Polyfill of React 19's use hook (only used against promises) */
export function use<T>(promise: Promise<T>): T {
    if (!valueByPromise.has(promise)) {
        if (!setOfProcessedPromises.has(promise)) {
            setOfProcessedPromises.add(promise);
            promise.then(value => valueByPromise.set(promise, value));
        }
        throw promise;
    }
    // @ts-expect-error: We know what we are doing.
    return valueByPromise.get(promise);
}
