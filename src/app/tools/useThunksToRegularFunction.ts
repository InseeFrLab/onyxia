import "minimal-polyfills/Object.fromEntries";
import { useMemo } from "react";
import type { Param0 } from "tsafe";
import { objectKeys } from "tsafe/objectKeys";
import type { Action, ThunkAction as GenericThunkAction } from "@reduxjs/toolkit";
import * as reactRedux from "react-redux";
import { symToStr } from "tsafe/symToStr";
import memoize from "memoizee";

export function useThunksToRegularFunction<
    DefaultThunkAction extends GenericThunkAction<
        Promise<void>,
        any,
        any,
        Action<string>
    >,
>() {
    type ThunkAction<ReturnType = Promise<void>> = GenericThunkAction<
        ReturnType,
        DefaultThunkAction extends GenericThunkAction<any, infer RootState, any, any>
            ? RootState
            : never,
        DefaultThunkAction extends GenericThunkAction<
            any,
            any,
            infer ThunksExtraArgument,
            any
        >
            ? ThunksExtraArgument
            : never,
        Action<string>
    >;

    type ThunkToRegularFunction<Thunk extends (params: any) => ThunkAction<any>> = (
        params: Param0<Thunk>,
    ) => Thunk extends () => ThunkAction<infer R> ? R : Promise<void>;

    const dispatch = reactRedux.useDispatch<(appThunk: ThunkAction<any>) => any>();

    const { thunksToRegularFunctions } = useMemo(() => {
        function thunksToRegularFunctions<
            Thunks extends Record<string, (params: any) => ThunkAction<any>>,
        >(
            thunks: Thunks,
        ): { [Key in keyof Thunks]: ThunkToRegularFunction<Thunks[Key]> } {
            return Object.fromEntries(
                objectKeys(thunks).map(name => [
                    name,
                    (params: any) => dispatch(thunks[name](params)),
                ]),
            ) as any;
        }

        return {
            [symToStr({ thunksToRegularFunctions })]: memoize(
                thunksToRegularFunctions,
            ) as typeof thunksToRegularFunctions,
        };
    }, [dispatch]);

    return { thunksToRegularFunctions };
}
