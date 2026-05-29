function isObject(item: unknown): item is Record<string, unknown> {
    return item !== null && typeof item === "object" && !Array.isArray(item);
}

function definePropertyFrom(params: {
    target: Record<string, unknown>;
    source: Record<string, unknown>;
    key: string;
}) {
    const { target, source, key } = params;

    const descriptor = Object.getOwnPropertyDescriptor(source, key);

    if (descriptor === undefined) {
        return;
    }

    Object.defineProperty(target, key, descriptor);
}

export function mergeDeep<
    A extends Record<string, unknown>,
    B extends Record<string, unknown>
>(a: A, b: B): A & B {
    const output: Record<string, unknown> = {};

    Object.defineProperties(output, Object.getOwnPropertyDescriptors(a));

    if (isObject(a) && isObject(b)) {
        Object.keys(b).forEach(key => {
            const bDescriptor = Object.getOwnPropertyDescriptor(b, key);

            if (
                bDescriptor === undefined ||
                !("value" in bDescriptor) ||
                !isObject(bDescriptor.value)
            ) {
                definePropertyFrom({ target: output, source: b, key });
                return;
            }

            const aDescriptor = Object.getOwnPropertyDescriptor(a, key);

            if (
                aDescriptor === undefined ||
                !("value" in aDescriptor) ||
                !isObject(aDescriptor.value)
            ) {
                definePropertyFrom({ target: output, source: b, key });
                return;
            }

            Object.defineProperty(output, key, {
                ...bDescriptor,
                value: mergeDeep(aDescriptor.value, bDescriptor.value)
            });
        });
    }

    return output as A & B;
}
