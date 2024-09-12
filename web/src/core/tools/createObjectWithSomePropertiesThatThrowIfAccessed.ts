export class AccessError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export const THROW_IF_ACCESSED = {
    __brand: "THROW_IF_ACCESSED"
};

export function createObjectWithSomePropertiesThatThrowIfAccessed<
    T extends Record<string, unknown>
>(obj: { [K in keyof T]: T[K] | typeof THROW_IF_ACCESSED }, debugMessage?: string): T {
    return Object.defineProperties(
        obj,
        Object.fromEntries(
            Object.entries(obj)
                .filter(([, value]) => value === THROW_IF_ACCESSED)
                .map(([key]) => {
                    const getAndSet = () => {
                        throw new AccessError(
                            `Cannot access ${key} yet ${debugMessage ?? ""}`
                        );
                    };

                    const pd = {
                        "get": getAndSet,
                        "set": getAndSet,
                        "enumerable": true
                    };

                    return [key, pd];
                })
        )
    ) as any;
}
