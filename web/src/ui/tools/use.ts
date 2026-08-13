type PromiseState<T> =
    | { status: "pending" }
    | { status: "fulfilled"; value: T }
    | { status: "rejected"; reason: unknown };

const stateByPromise = new WeakMap<Promise<unknown>, PromiseState<unknown>>();

/** Polyfill of React 19's use hook (only used against promises) */
export function use<T>(promise: Promise<T>): T {
    let state = stateByPromise.get(promise) as PromiseState<T> | undefined;

    if (state === undefined) {
        state = { status: "pending" };
        stateByPromise.set(promise, state);

        promise.then(
            value => stateByPromise.set(promise, { status: "fulfilled", value }),
            reason => stateByPromise.set(promise, { status: "rejected", reason })
        );

        throw promise;
    }

    switch (state.status) {
        case "pending":
            throw promise;
        case "rejected":
            throw state.reason;
        case "fulfilled":
            return state.value;
    }
}
