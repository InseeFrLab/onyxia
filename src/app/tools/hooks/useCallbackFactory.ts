
import { useRef, useState } from "react";
import memoize from "memoizee";
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
 * 
 * WARNING: Factory args should not be of variable length.
 * 
 */
export function useCallbackFactory<
    FactoryArgs extends unknown[],
    Args extends unknown[],
    R = void
>(
    callback: (...callbackArgs: [FactoryArgs, Args]) => R
): CallbackFactory<FactoryArgs, Args, R> {

    type Out = CallbackFactory<FactoryArgs, Args, R>;

    const callbackRef = useRef<typeof callback>(callback);

    callbackRef.current = callback;

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


