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
import * as projectsUseCase from "lib/useCases/projects";
import { useThunksToRegularFunction } from "app/tools/react-redux-tools/useThunksToRegularFunction";
import { wrapSelectorsReturnValue } from "app/tools/react-redux-tools/wrapSelectorsReturnValue";

export const useSelector: reactRedux.TypedUseSelectorHook<RootState> =
    reactRedux.useSelector;

// prettier-ignore
export const selectors = {
    [launcherUseCase.name]: wrapSelectorsReturnValue(launcherUseCase.selectors),
    [restorablePackageConfigsUseCase.name]: wrapSelectorsReturnValue(restorablePackageConfigsUseCase.selectors),
    [deploymentRegionUseCase.name]: wrapSelectorsReturnValue(deploymentRegionUseCase.selectors),
    [projectsUseCase.name]: wrapSelectorsReturnValue(projectsUseCase.selectors),
    [userConfigsUseCase.name]: userConfigsUseCase.selectors.userConfigs,
};

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
            [`${projectsUseCase.name}${wordId}` as const]: thunksToRegularFunctions(projectsUseCase.thunks),
        }),
        [thunksToRegularFunctions]
    );
}

export const pure = {
    [secretExplorerUseCase.name]: secretExplorerUseCase.pure,
    [restorablePackageConfigsUseCase.name]: restorablePackageConfigsUseCase.pure,
};
