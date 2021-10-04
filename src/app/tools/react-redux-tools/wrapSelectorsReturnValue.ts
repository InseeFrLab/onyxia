import type { Param0 } from "tsafe";
import { objectKeys } from "tsafe/objectKeys";

export function wrapSelectorsReturnValue<
    Selectors extends { [Name in string]: (state: any) => unknown },
>(
    selectors: Selectors,
): {
    [Name in keyof Selectors]: (
        state: Param0<Selectors[Name]>,
    ) => Record<Name, ReturnType<Selectors[Name]>>;
} {
    return Object.fromEntries(
        objectKeys(selectors).map(name => [
            name,
            (state: Param0<Selectors[typeof name]>) => ({
                [name]: selectors[name](state),
            }),
        ]),
    ) as any;
}
