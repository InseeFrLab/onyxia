
export function createObjectThatThrowsIfAccessed<State extends object>(
    debugMessage?: string
): State {

    const get: NonNullable<ProxyHandler<State>["get"]> = (...args) => {

        const [, prop] = args

        if (typeof prop === "symbol") {
            return Reflect.get(...args);
        }

        throw new Error(`Cannot access ${prop} yet ${debugMessage ?? ""}`);

    };

    return new Proxy<State>(
        {} as any,
        {
            get,
            "set": get
        }
    );

}