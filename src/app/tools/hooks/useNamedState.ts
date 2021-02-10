
import { useState } from "react";
import { capitalize } from "app/tools/capitalize";
import type { Dispatch, SetStateAction } from "react";

export type UseNamedStateReturnType<T, Name extends string> =
    Record<Name, T> & Record<`set${Capitalize<Name>}`, Dispatch<SetStateAction<T>>>;

export function useNamedState<T, Name extends string>(
    name: Name,
    initialState: T | (() => T)
): UseNamedStateReturnType<T, Name> {

    const [state, setState] = useState(initialState);

    return {
        [name]: state,
        [`set${capitalize(name)}`]: setState
    } as any;

}
