import "minimal-polyfills/Object.fromEntries";
import * as reactRedux from "react-redux";
import type { Store, RootState } from "lib/setup";
import type { Param0 } from "tsafe";

import type { AppThunk as Xxx } from "lib/setup";
import { objectKeys } from "tsafe/objectKeys";
import type { Action, ThunkAction as GenericThunkAction } from "@reduxjs/toolkit";

import * as secretExplorerUseCase from "lib/useCases/secretExplorer";
import * as userConfigsUseCase from "lib/useCases/userConfigs";
import * as launcherUseCase from "lib/useCases/launcher";
import * as catalogExplorerUseCase from "lib/useCases/catalogExplorer";
import * as runningServiceUseCase from "lib/useCases/runningService";
import * as restorablePackageConfigsUseCase from "lib/useCases/restorablePackageConfigs";
import * as publicIpUseCase from "lib/useCases/publicIp";
import * as userAuthenticationUseCase from "lib/useCases/userAuthentication";
import * as deploymentRegionUseCase from "lib/useCases/deploymentRegion";

export const useSelector: reactRedux.TypedUseSelectorHook<RootState> =
    reactRedux.useSelector;

function useThunksToRegularFunction<
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

    function thunksToRegularFunctions<
        Thunks extends Record<string, (params: any) => ThunkAction<any>>,
    >(thunks: Thunks): { [Key in keyof Thunks]: ThunkToRegularFunction<Thunks[Key]> } {
        return Object.fromEntries(
            objectKeys(thunks).map(name => [
                name,
                (params: any) => dispatch(thunks[name](params)),
            ]),
        ) as any;
    }

    return { thunksToRegularFunctions };
}

export function useThunks() {
    const { thunksToRegularFunctions } = useThunksToRegularFunction<Xxx>();

    const wordId = "Thunks" as const;

    return {
        [`${secretExplorerUseCase.name}${wordId}` as const]: thunksToRegularFunctions(
            secretExplorerUseCase.thunks,
        ),
        [`${userConfigsUseCase.name}${wordId}` as const]: thunksToRegularFunctions(
            userConfigsUseCase.thunks,
        ),
        [`${launcherUseCase.name}${wordId}` as const]: thunksToRegularFunctions(
            launcherUseCase.thunks,
        ),
        [`${catalogExplorerUseCase.name}${wordId}` as const]: thunksToRegularFunctions(
            catalogExplorerUseCase.thunks,
        ),
        [`${runningServiceUseCase.name}${wordId}` as const]: thunksToRegularFunctions(
            runningServiceUseCase.thunks,
        ),
        [`${restorablePackageConfigsUseCase.name}${wordId}` as const]:
            thunksToRegularFunctions(restorablePackageConfigsUseCase.thunks),
        [`${publicIpUseCase.name}${wordId}` as const]: thunksToRegularFunctions(
            publicIpUseCase.thunks,
        ),
        [`${userAuthenticationUseCase.name}${wordId}` as const]: thunksToRegularFunctions(
            userAuthenticationUseCase.thunks,
        ),
        [`${deploymentRegionUseCase.name}${wordId}` as const]: thunksToRegularFunctions(
            deploymentRegionUseCase.thunks,
        ),
    };
}

//type Out = ThunksToRegularFunctions<typeof secretExplorerUseCase["thunks"]>;

//const x: Out = null as any;
