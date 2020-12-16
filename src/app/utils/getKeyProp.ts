import { objectKeys } from "evt/tools/typeSafety/objectKeys";
import { assert } from "evt/tools/typeSafety/assert";

export function getKeyPropFactory<T extends Record<string, string>>() {

    const map = new Map<string, string>();

    const getCount = (()=>{

        let count = 0;

        return ()=> `${count++}`;

    })();

    const stringify = (values: T) => {

        const out = {} as T;

        objectKeys(values)
            .sort()
            .forEach(key=> out[key]= values[key]);

        return JSON.stringify(out);

    };

    function getKeyProp(values: T): string {

        const key = stringify(values);

        const keyProp = map.get(key)

        if( keyProp === undefined ){

            const keyProp = getCount();
            map.set(key, keyProp)
            return keyProp;

        }

        return keyProp;

    }

    function transfersKeyProp(params: { fromValues: T, toValues: T }): void {

        const { fromValues, toValues }= params;

        map.set(stringify(toValues), getKeyProp(fromValues));

        map.delete(stringify(fromValues));

    }

    function getValuesCurrentlyMappedToKeyProp(keyProp: string): T {

        const key = Array.from(map.keys())
            .find(key => map.get(key)! === keyProp);

        assert( key !== undefined );
        
        return JSON.parse(key);

    }

    return { getKeyProp, transfersKeyProp, getValuesCurrentlyMappedToKeyProp };

}
