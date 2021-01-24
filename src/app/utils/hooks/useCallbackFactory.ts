
import { useMemo, useRef } from "react";
import memoize from "memoizee";
import type { DependencyList } from "react";

/**
 *  const callbackFactory= useCallbackFactory(
 *      ([key]: [string], [params]: [{ foo: number; }]) => {    
 *          ...
 *      },
 *      []
 *  );
 */
export function useCallbackFactory<
    FactoryArgs extends unknown[],
    Args extends unknown[],
    R = void
>(
    callback: (...callbackArgs: [FactoryArgs, Args]) => R,
    deps: DependencyList
): (...factoryArgs: FactoryArgs) => (...args: Args) => R {

    const callbackRef = useRef<typeof callback>(callback);

    useMemo(
        () => callbackRef.current = callback,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        deps
    );

    return useMemo(
        () => memoize(
            (...factoryArgs: FactoryArgs) =>
                (...args: Args) =>
                    callbackRef.current(factoryArgs, args)
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

}
