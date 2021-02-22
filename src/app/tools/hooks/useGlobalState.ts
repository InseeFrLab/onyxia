
import { useState } from "react";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { useConstCallback } from "./useConstCallback";
import { assert } from "evt/tools/typeSafety/assert";
import { overwriteReadonlyProp } from "evt/tools/typeSafety/overwriteReadonlyProp";
import type { UseNamedStateReturnType } from "./useNamedState";
import { typeGuard } from "evt/tools/typeSafety/typeGuard";
import { capitalize } from "app/tools/capitalize";


type PersistentStorage = {
    getItem(): string | null;
    setItem(value: string): void;
};

const { getPersistentStorage } = (() => {


    function getLocalStorageImplementationOfPersistantStorage(
        params: {
            key: string;
        }
    ): PersistentStorage {

        const { key } = params;

        return {
            "getItem": () => localStorage.getItem(key),
            "setItem": value => localStorage.setItem(key, value)
        };

    }

    function getCookieImplementationOfPersistantStorage(
        params: {
            key: string;
        }
    ): PersistentStorage {

        const { key } = params;

        return {
            "getItem": () => {
                return document.cookie
                    .split("; ")
                    .find(row => row.startsWith(`${key}=`))
                    ?.split("=")?.[1] ?? null;
            },
            "setItem": value => {

                let newCookie = `${key}=${value}`;

                //We do not set the domain if we are on localhost or an ip
                if (window.location.hostname.match(/\.[a-zA-Z]{2,}$/)) {
                    newCookie += `; domain=${window.location.hostname.split(".").length >= 3 ?
                        window.location.hostname.replace(/^[^.]+\./, "") :
                        window.location.hostname
                        }`;
                }

                document.cookie = newCookie;

            }
        }

    }

    function getPersistentStorage(
        params: {
            key: string;
            mechanism: "localStorage" | "cookies"
        }
    ): PersistentStorage {

        const { key, mechanism } = params;

        switch (mechanism) {
            case "localStorage": return getLocalStorageImplementationOfPersistantStorage({ key });
            case "cookies": return getCookieImplementationOfPersistantStorage({ key });
        }
    }

    return { getPersistentStorage };


})();



const names = new Set<string>();

/**
 * 
 * Assert: If localStorageKey is not disabled, T must be 
 * serializable with JSON.stringify.
 * 
 * const { useFoo } = createUseGlobalState2({
 *     "getDefaultState": ()=> 33,
 *     "name": "foo"
 * });
 *
 * const { foo, setFoo  } = useFoo();
 */
export function createUseGlobalState<T, Name extends string>(
    name: Name,
    /** If function called only if not in local storage */
    initialState: T | (() => T),
    params?: {
        persistance?: false | "localStorage" | "cookies"
    }
): Record<
    `use${Capitalize<Name>}`,
    () => UseNamedStateReturnType<T, Name>
> {

    const { persistance = "cookies" } = params ?? {};

    const persistentStorage = persistance === false ?
        undefined :
        getPersistentStorage({
            "mechanism": persistance ?? "localStorage",
            "key": (
                assert(!names.has(name)),
                names.add(name),
                `useGlobalState_${name}`
            )
        });

    //TODO: should be initialized when first used
    const evtValue = Evt.create(
        (
            (
                persistentStorage !== undefined &&
                (() => {

                    const serializedBoxedValue = persistentStorage.getItem();

                    return serializedBoxedValue === null ?
                        false :
                        JSON.parse(serializedBoxedValue) as [T]
                        ;

                })()
            )
            ||
            [
                typeGuard<() => T>(initialState, typeof initialState === "function") ?
                    initialState() :
                    initialState
            ]
        )[0]
    );

    if (persistentStorage !== undefined) {

        evtValue.attach(value =>
            persistentStorage.setItem(JSON.stringify([value]))
        );

    }

    function useGlobalState() {

        const [state, setState] = useState(evtValue.state);

        useEvt(
            ctx => evtValue
                .toStateless(ctx)
                .attach(setState),
            []
        );

        return {
            [name]: state,
            [`set${capitalize(name)}`]:
                useConstCallback((valueOrGetValue: any) =>
                    evtValue.state = typeof valueOrGetValue === "function" ?
                        valueOrGetValue(state) :
                        valueOrGetValue
                )
        } as any;

    }

    const out = {
        [`use${capitalize(name)}`]: useGlobalState
    }

    try {
        overwriteReadonlyProp(useGlobalState as any, "name", Object.keys(out)[0]);
    } catch { }

    return out as any;

}

