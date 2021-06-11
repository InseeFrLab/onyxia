
import { assert } from "tsafe/assert";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk } from "../setup";
import { id } from "tsafe/id";
import { thunks as appConstantsThunks } from "./appConstants";
export const name = "runningService";

export type RunningServicesState =
    RunningServicesState.NotFetched |
    RunningServicesState.Ready;

export namespace RunningServicesState {

    type Common = {
        isFetching: boolean;
    };

    export type NotFetched = Common & {
        isFetched: false;
    };

    export type Ready = Common & {
        isFetched: true;
        runningServices: RunningService[];
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
};

const { reducer, actions } = createSlice({
    name,
    "initialState": id<RunningServicesState>(
        id<RunningServicesState.NotFetched>({
            "isFetched": false,
            "isFetching": false
        })
    ),
    "reducers": {
        "fetchStarted": state => { state.isFetching = true },
        "fetchCompleted": (
            _,
            { payload }: PayloadAction<{ runningServices: RunningService[]; }>
        ) => {

            const { runningServices } = payload;

            return id<RunningServicesState.Ready>({
                "isFetching": false,
                "isFetched": true,
                runningServices
            });

        },
        "serviceStarted": (
            state,
            { payload }: PayloadAction<{ serviceId: string; }>
        ) => {

            const { serviceId } = payload;

            assert(state.isFetched);

            const runningService = state.runningServices.find(
                ({ id }) => id === serviceId
            );

            if (runningService === undefined) {
                return;
            }

            runningService.isStarting = false;

            //NOTE: Harmless hack to improve UI readability.
            runningService.startedAt = Date.now();

        },
        "serviceStopped": (
            state,
            { payload }: PayloadAction<{ serviceId: string; }>
        ) => {

            const { serviceId } = payload;

            assert(state.isFetched);

            state.runningServices.splice(
                state.runningServices.findIndex(({ id }) => id === serviceId),
                1
            );


        }
    },
});

export { reducer };

export const thunks = {
    "initializeOrRefreshIfNotAlreadyFetching": (): AppThunk<void> => async (...args) => {

        const [dispatch, getState, { onyxiaApiClient }] = args;

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

            function getLogoUrl(
                params: {
                    packageName: string;
                }
            ): string | undefined {

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

            return { getLogoUrl }

        })();

        const getMonitoringUrl = (params: { serviceId: string; }) => {

            const { serviceId } = params;

            const { selectedRegion, preferred_username } = (() => {

                const appConstants = dispatch(appConstantsThunks.getAppConstants());

                assert(appConstants.isUserLoggedIn);

                const deploymentRegionId = getState().userConfigs.deploymentRegionId.value;

                const selectedRegion = appConstants.regions.find(({ id }) => id === deploymentRegionId)!;

                const { preferred_username } = appConstants.parsedJwt;

                return { selectedRegion, preferred_username };

            })();

            const namespacePrefix = selectedRegion.services.namespacePrefix;


            return selectedRegion.services.monitoring?.URLPattern
                ?.replace("$NAMESPACE", `${namespacePrefix}${preferred_username}`)
                .replace("$INSTANCE", serviceId.replace(/^\//, ""));

        };


        dispatch(
            actions.fetchCompleted({
                "runningServices":
                    runningServicesRaw.map(
                        ({ id, friendlyName, packageName, urls, startedAt, ...rest }) => ({
                            id,
                            packageName,
                            friendlyName,
                            "logoUrl": getLogoUrl({ packageName }),
                            "monitoringUrl": getMonitoringUrl({ "serviceId": id }),
                            startedAt,
                            urls,
                            "isStarting": !rest.isStarting ?
                                false :
                                (
                                    rest.prStarted.then(
                                        () => dispatch(actions.serviceStarted({ "serviceId": id }))
                                    ),
                                    true
                                )
                        })
                    )
            })
        );

    },
    "stopService": (
        params: {
            serviceId: string;
        }
    ): AppThunk<void> => async (...args) => {

        const { serviceId } = params;

        const [dispatch, , dependencies] = args;

        dispatch(actions.serviceStopped({ serviceId }));

        await dependencies.onyxiaApiClient.stopService({ serviceId });

    },
};


