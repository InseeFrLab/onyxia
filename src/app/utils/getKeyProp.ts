
import { assert } from "evt/tools/typeSafety/assert";

export function getKeyPropFactory<T extends Record<string, string>>() {

    const map = new Map<string, string>();

    const getCount = (()=>{

        let count = 0;

        return ()=> `${count++}`;

    })();

    const stringify = (values: T) =>
         Object
            .keys(values)
            .sort()
            .map(key => values[key])
            .join("-");

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


    return { getKeyProp, transfersKeyProp };

}
