
export function createObjectThatThrowsIfAccessed<T extends object>(
    debugMessage?: string
): T {

    const get: NonNullable<ProxyHandler<T>["get"]> = (...args) => {

        const [, prop] = args

        if (typeof prop === "symbol") {
            return Reflect.get(...args);
        }

        throw new Error(`Cannot access ${prop} yet ${debugMessage ?? ""}`);

    };

    return new Proxy<T>(
        {} as any,
        {
            get,
            "set": get
        }
    );

}

export function createPropertyThatThrowIfAccessed<T extends object, PropertyName extends keyof T>(
    propertyName: PropertyName,
    debugMessage?: string
): { [K in PropertyName]: T[K]; } {

    const getAndSet = () => {
        throw new Error(`Cannot access ${propertyName} yet ${debugMessage ?? ""}`);
    };

    return Object.defineProperty(
        {},
        propertyName,
        {
            "get": getAndSet,
            "set": getAndSet,
            "enumerable": true
        }
    );

}

