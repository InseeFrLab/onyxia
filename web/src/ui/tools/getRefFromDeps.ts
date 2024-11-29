import type { DependencyList } from "react";
import memoize from "memoizee";

export function getRefFromDepsFactory(params: { max: number }) {
    const { max } = params;

    const memoizedByNumberOfArgument = new Map<
        number,
        (...deps: DependencyList) => object
    >();

    function getRefFromDeps(deps: DependencyList): object {
        let memoized = memoizedByNumberOfArgument.get(deps.length);

        if (memoized !== undefined) {
            return memoized(...deps);
        }

        memoizedByNumberOfArgument.set(
            deps.length,
            memoize((..._deps: DependencyList) => ({}), {
                length: deps.length,
                max
            })
        );

        return getRefFromDeps(deps);
    }

    return { getRefFromDeps };
}
