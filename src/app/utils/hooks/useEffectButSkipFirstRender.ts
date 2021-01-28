

import { useEffect, useRef } from "react";
import type { EffectCallback, DependencyList } from "react";

export function useEffectButSkipFirstRender(effect: EffectCallback, deps?: DependencyList): void {

        const refIsFistRender = useRef(true);

        useEffect(() => {

            if (refIsFistRender.current) {
                refIsFistRender.current = false;
                return;
            }

            return effect();

        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, deps);

}