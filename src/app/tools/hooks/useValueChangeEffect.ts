
import { useEffectButSkipFirstRender } from "./useEffectButSkipFirstRender";

export function useValueChangeEffect<T extends readonly [value: any, ...moreValues: any[]]>(
    effect: (...args: T) => void,
    values: T
): void {

    useEffectButSkipFirstRender(() => {

        effect(...values);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, values);

}