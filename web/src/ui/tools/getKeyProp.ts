import { objectKeys } from "tsafe/objectKeys";
import { assert } from "tsafe/assert";

export function getKeyPropFactory<T extends Record<string, string>>() {
    const map = new Map<string, string>();

    const getCount = (() => {
        let count = 0;

        return () => `${count++}`;
    })();

    const stringify = (values: T) => {
        const out = {} as T;

        objectKeys(values)
            .sort()
            .forEach(key => (out[key] = values[key]));

        return JSON.stringify(out);
    };

    function getKeyProp(values: T): string {
        const key = stringify(values);

        const keyProp = map.get(key);

        if (keyProp === undefined) {
            const keyProp = getCount();
            map.set(key, keyProp);
            return keyProp;
        }

        return keyProp;
    }

    function transfersKeyProp(params: { fromValues: T; toValues: T }): void {
        const { fromValues, toValues } = params;

        const fromKey = stringify(fromValues);
        const toKey = stringify(toValues);

        if (fromKey === toKey) {
            return;
        }

        map.set(toKey, getKeyProp(fromValues));

        map.delete(fromKey);
    }

    function getValuesCurrentlyMappedToKeyProp(keyProp: string): T {
        const key = Array.from(map.keys()).find(key => map.get(key)! === keyProp);

        assert(key !== undefined);

        return JSON.parse(key);
    }

    return {
        getKeyProp,
        transfersKeyProp,
        getValuesCurrentlyMappedToKeyProp
    };
}
