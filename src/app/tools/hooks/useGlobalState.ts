
import { useState } from "react";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { useConstCallback } from "./useConstCallback";
import { assert } from "evt/tools/typeSafety/assert";
import { overwriteReadonlyProp } from "evt/tools/typeSafety/overwriteReadonlyProp";
import type { UseNamedStateReturnType } from "./useNamedState";
import { typeGuard } from "evt/tools/typeSafety/typeGuard";
import { capitalize } from "app/tools/capitalize";

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
        doDisableLocalStorage?: boolean;
    }
): Record<
    `use${Capitalize<Name>}`,
    () => UseNamedStateReturnType<T, Name>
> {

    const { doDisableLocalStorage = false } = params ?? {};

    const localStorageKey = doDisableLocalStorage ?
        undefined :
        (
            assert(!names.has(name)),
            names.add(name),
            `useGlobalState_${name}`
        );

    //TODO: should be initialized when first used
    const evtValue = Evt.create(
        (
            (
                localStorageKey !== undefined &&
                (() => {

                    const serializedBoxedValue = localStorage.getItem(localStorageKey);

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

    if (localStorageKey !== undefined) {

        evtValue.attach(value => localStorage.setItem(
            localStorageKey,
            JSON.stringify([value]))
        );

    }

    function useGlobalState(){

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
                useConstCallback(value => evtValue.state = value)
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

