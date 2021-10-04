import { useMemo } from "react";
import * as reactRedux from "react-redux";
import type { RootState } from "lib/setup";
import type { ThunkAction } from "lib/setup";
import * as secretExplorerUseCase from "lib/useCases/secretExplorer";
import * as userConfigsUseCase from "lib/useCases/userConfigs";
import * as launcherUseCase from "lib/useCases/launcher";
import * as catalogExplorerUseCase from "lib/useCases/catalogExplorer";
import * as runningServiceUseCase from "lib/useCases/runningService";
import * as restorablePackageConfigsUseCase from "lib/useCases/restorablePackageConfigs";
import * as publicIpUseCase from "lib/useCases/publicIp";
import * as userAuthenticationUseCase from "lib/useCases/userAuthentication";
import * as deploymentRegionUseCase from "lib/useCases/deploymentRegion";
import { useThunksToRegularFunction } from "app/tools/useThunksToRegularFunction";

export const useSelector: reactRedux.TypedUseSelectorHook<RootState> =
    reactRedux.useSelector;

export const selectors = (() => {
    const wordId = "Selector" as const;

    return {
        [`${launcherUseCase.name}${wordId}` as const]: launcherUseCase.selectors,
        [`${restorablePackageConfigsUseCase.name}${wordId}` as const]:
            restorablePackageConfigsUseCase.selectors,
        [`${deploymentRegionUseCase.name}${wordId}` as const]:
            deploymentRegionUseCase.selectors,
    };
})();

//launcherUseCase.selectors

export function useThunks() {
    const { thunksToRegularFunctions } = useThunksToRegularFunction<ThunkAction>();

    const wordId = "Thunks" as const;

    // prettier-ignore
    return useMemo(
        () => ({
            [`${secretExplorerUseCase.name}${wordId}` as const]: thunksToRegularFunctions(secretExplorerUseCase.thunks),
            [`${userConfigsUseCase.name}${wordId}` as const]: thunksToRegularFunctions(userConfigsUseCase.thunks),
            [`${launcherUseCase.name}${wordId}` as const]: thunksToRegularFunctions(launcherUseCase.thunks),
            [`${catalogExplorerUseCase.name}${wordId}` as const]: thunksToRegularFunctions(catalogExplorerUseCase.thunks),
            [`${runningServiceUseCase.name}${wordId}` as const]: thunksToRegularFunctions(runningServiceUseCase.thunks),
            [`${restorablePackageConfigsUseCase.name}${wordId}` as const]: thunksToRegularFunctions(restorablePackageConfigsUseCase.thunks),
            [`${publicIpUseCase.name}${wordId}` as const]: thunksToRegularFunctions(publicIpUseCase.thunks),
            [`${userAuthenticationUseCase.name}${wordId}` as const]: thunksToRegularFunctions(userAuthenticationUseCase.thunks),
            [`${deploymentRegionUseCase.name}${wordId}` as const]: thunksToRegularFunctions(deploymentRegionUseCase.thunks),
        }),
        [thunksToRegularFunctions]
    );
}
