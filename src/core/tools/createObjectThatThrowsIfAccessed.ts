export function createObjectThatThrowsIfAccessed<T extends object>(params?: {
    debugMessage?: string;
    isPropertyWhitelisted?: (prop: string | number | symbol) => boolean;
}): T {
    const { debugMessage = "", isPropertyWhitelisted = () => false } = params ?? {};

    const get: NonNullable<ProxyHandler<T>["get"]> = (...args) => {
        const [, prop] = args;

        if (isPropertyWhitelisted(prop)) {
            return Reflect.get(...args);
        }

        throw new Error(`Cannot access ${String(prop)} yet ${debugMessage}`);
    };

    return new Proxy<T>({} as any, {
        get,
        "set": get,
    });
}

export function createObjectThatThrowsIfAccessedFactory(params: {
    isPropertyWhitelisted?: (prop: string | number | symbol) => boolean;
}) {
    const { isPropertyWhitelisted } = params;

    return {
        "createObjectThatThrowsIfAccessed": <T extends object>(params?: {
            debugMessage?: string;
        }) => {
            const { debugMessage } = params ?? {};

            return createObjectThatThrowsIfAccessed<T>({
                debugMessage,
                isPropertyWhitelisted,
            });
        },
    };
}

export function isPropertyAccessedByReduxOrStorybook(prop: string | number | symbol) {
    switch (typeof prop) {
        case "symbol":
            return ["Symbol.toStringTag", "immer-state"]
                .map(s => `Symbol(${s})`)
                .includes(String(prop));
        case "string":
            return ["window", "toJSON"].includes(prop);
        case "number":
            return false;
    }
}

export function createPropertyThatThrowIfAccessed<
    T extends object,
    PropertyName extends keyof T,
>(propertyName: PropertyName, debugMessage?: string): { [K in PropertyName]: T[K] } {
    const getAndSet = () => {
        throw new Error(
            `Cannot access ${String(propertyName)} yet ${debugMessage ?? ""}`,
        );
    };

    return Object.defineProperty({} as any, propertyName, {
        "get": getAndSet,
        "set": getAndSet,
        "enumerable": true,
    });
}
