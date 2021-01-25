
import { useMemo, useRef, useState } from "react";
import memoize from "memoizee";
import type { DependencyList } from "react";
import { id } from "evt/tools/typeSafety/id";

export type CallbackFactory<
    FactoryArgs extends unknown[],
    Args extends unknown[],
    R
    > = (...factoryArgs: FactoryArgs) => (...args: Args) => R

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
): CallbackFactory<FactoryArgs, Args, R> {

    type Out = CallbackFactory<FactoryArgs, Args, R>;

    const callbackRef = useRef<typeof callback>(callback);

    useMemo(
        () => callbackRef.current = callback,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        deps
    );

    const memoizedRef = useRef<Out | undefined>(undefined);

    return useState(
        () => id<Out>(
            (...factoryArgs) => {

                if (memoizedRef.current === undefined) {

                    memoizedRef.current = memoize(
                        (...factoryArgs: FactoryArgs) =>
                            (...args: Args) =>
                                callbackRef.current(factoryArgs, args),
                        { "length": factoryArgs.length }
                    );

                }

                return memoizedRef.current(...factoryArgs);

            }

        )
    )[0];

}

export function useCallback<T extends (...args: never[]) => unknown>(
    callback: T,
    deps: DependencyList
): T {

    const callbackRef = useRef<T>(callback);

    useMemo(
        () => callbackRef.current = callback,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        deps
    );

    return useState(() =>
        (...args: Parameters<T>) => callbackRef.current(...args)
    )[0] as T;

}

