import { assert } from "tsafe/assert";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ThunkAction } from "../setup";
import { id } from "tsafe/id";
import { selectors as deploymentRegionSelectors } from "./deploymentRegion";
import { selectors as projectSelectionSelectors } from "./projectSelection";
import type { RootState } from "../setup";

export const name = "runningService";

type RunningServicesState = RunningServicesState.NotFetched | RunningServicesState.Ready;

namespace RunningServicesState {
    type Common = {
        isFetching: boolean;
    };

    export type NotFetched = Common & {
        isFetched: false;
    };

    export type Ready = Common & {
        isFetched: true;
        /** We force using a selector to retrieve the running services
         * because we want to sort them and exclude the ones that are not
         * supposed to be displayed ( !isOwner && !isShared )
         */
        "~internal": {
            runningServices: RunningService[];
        };
    };
}

export type RunningService = {
    id: string;
    packageName: string;
    friendlyName: string;
    logoUrl: string | undefined;
    monitoringUrl: string | undefined;
    isStarting: boolean;
    startedAt: number;
    urls: string[];
    postInstallInstructions: string | undefined;
    isShared: boolean;
    env: Record<string, string>;
    isOwned: boolean;
};

const { reducer, actions } = createSlice({
    name,
    "initialState": id<RunningServicesState>(
        id<RunningServicesState.NotFetched>({
            "isFetched": false,
            "isFetching": false,
        }),
    ),
    "reducers": {
        "fetchStarted": state => {
            state.isFetching = true;
        },
        "fetchCompleted": (
            _,
            { payload }: PayloadAction<{ runningServices: RunningService[] }>,
        ) => {
            const { runningServices } = payload;

            return id<RunningServicesState.Ready>({
                "isFetching": false,
                "isFetched": true,
                "~internal": {
                    runningServices,
                },
            });
        },
        "serviceStarted": (
            state,
            {
                payload,
            }: PayloadAction<{
                serviceId: string;
                doOverwriteStaredAtToNow: boolean;
            }>,
        ) => {
            const { serviceId, doOverwriteStaredAtToNow } = payload;

            assert(state.isFetched);

            const runningService = state["~internal"].runningServices.find(
                ({ id }) => id === serviceId,
            );

            if (runningService === undefined) {
                return;
            }

            runningService.isStarting = false;

            if (doOverwriteStaredAtToNow) {
                //NOTE: Harmless hack to improve UI readability.
                runningService.startedAt = Date.now();
            }
        },
        "serviceStopped": (state, { payload }: PayloadAction<{ serviceId: string }>) => {
            const { serviceId } = payload;

            assert(state.isFetched);

            const { runningServices } = state["~internal"];

            runningServices.splice(
                runningServices.findIndex(({ id }) => id === serviceId),
                1,
            );
        },
    },
});

export { reducer };

export const thunks = {
    "initializeOrRefreshIfNotAlreadyFetching":
        (): ThunkAction<void> =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApiClient, userApiClient }] = args;

            {
                const state = getState().runningService;

                if (state.isFetching) {
                    return;
                }
            }

            dispatch(actions.fetchStarted());

            const runningServicesRaw = await onyxiaApiClient.getRunningServices();

            //NOTE: We do not have the catalog id so we search in every catalog.
            const { getLogoUrl } = await (async () => {
                const apiRequestResult = await onyxiaApiClient.getCatalogs();

                function getLogoUrl(params: { packageName: string }): string | undefined {
                    const { packageName } = params;

                    for (const { catalog } of apiRequestResult) {
                        for (const { name, icon } of catalog.packages) {
                            if (name !== packageName) {
                                continue;
                            }
                            return icon;
                        }
                    }
                    return undefined;
                }

                return { getLogoUrl };
            })();

            const getMonitoringUrl = (params: { serviceId: string }) => {
                const { serviceId } = params;

                const project = projectSelectionSelectors.selectedProject(getState());

                const selectedDeploymentRegion =
                    deploymentRegionSelectors.selectedDeploymentRegion(getState());

                return selectedDeploymentRegion.servicesMonitoringUrlPattern
                    ?.replace("$NAMESPACE", project.namespace)
                    .replace("$INSTANCE", serviceId.replace(/^\//, ""));
            };

            const { username } = await userApiClient.getUser();

            dispatch(
                actions.fetchCompleted({
                    "runningServices": runningServicesRaw.map(
                        ({
                            id,
                            friendlyName,
                            packageName,
                            urls,
                            startedAt,
                            postInstallInstructions,
                            isShared,
                            env,
                            owner,
                            ...rest
                        }) => ({
                            id,
                            packageName,
                            friendlyName,
                            isShared,
                            env,
                            "logoUrl": getLogoUrl({ packageName }),
                            "monitoringUrl": getMonitoringUrl({
                                "serviceId": id,
                            }),
                            startedAt,
                            "urls": urls.sort(),
                            "isStarting": !rest.isStarting
                                ? false
                                : (rest.prStarted.then(({ isConfirmedJustStarted }) =>
                                      dispatch(
                                          actions.serviceStarted({
                                              "serviceId": id,
                                              "doOverwriteStaredAtToNow":
                                                  isConfirmedJustStarted,
                                          }),
                                      ),
                                  ),
                                  true),
                            postInstallInstructions,
                            "isOwned": owner === username,
                        }),
                    ),
                }),
            );
        },
    "stopService":
        (params: { serviceId: string }): ThunkAction<void> =>
        async (...args) => {
            const { serviceId } = params;

            const [dispatch, , { onyxiaApiClient }] = args;

            dispatch(actions.serviceStopped({ serviceId }));

            await onyxiaApiClient.stopService({ serviceId });
        },
};

export const selectors = (() => {
    const runningServices = (rootState: RootState): RunningService[] => {
        const state = rootState.runningService;

        return !state.isFetched
            ? []
            : state["~internal"].runningServices
                  .filter(({ isShared, isOwned }) => isOwned || isShared)
                  .sort((a, b) => b.startedAt - a.startedAt);
    };

    return { runningServices };
})();
