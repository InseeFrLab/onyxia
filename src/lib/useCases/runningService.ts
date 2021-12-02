import { assert } from "tsafe/assert";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ThunkAction } from "../setup";
import { id } from "tsafe/id";
import { selectors as deploymentRegionSelectors } from "./deploymentRegion";
import { selectors as projectSelectionSelectors } from "./projectSelection";
import type { RootState } from "../setup";
import { exclude } from "tsafe/exclude";
import { thunks as launcherThunks } from "./launcher";

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

export type RunningService = RunningService.Owned | RunningService.NotOwned;

export declare namespace RunningService {
    export type Common = {
        id: string;
        packageName: string;
        friendlyName: string;
        logoUrl: string | undefined;
        monitoringUrl: string | undefined;
        isStarting: boolean;
        startedAt: number;
        /** Undefined if the service don't use the token */
        vaultTokenExpirationTime: number | undefined;
        s3TokenExpirationTime: number | undefined;
        urls: string[];
        postInstallInstructions: string | undefined;
        env: Record<string, string>;
    };

    export type Owned = Common & {
        isShared: boolean;
        isOwned: true;
    };

    export type NotOwned = Common & {
        isShared: true;
        isOwned: false;
        ownerUsername: string;
    };
}

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
            const [
                dispatch,
                getState,
                { onyxiaApiClient, userApiClient, secretsManagerClient },
            ] = args;

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

            const [{ s3TokensTTLms }, { vaultTokenTTLms }] = await Promise.all([
                (async () => {
                    const { acquisitionTime, expirationTime } = await dispatch(
                        launcherThunks.getS3MustacheParamsForProjectBucket(),
                    );

                    return { "s3TokensTTLms": expirationTime - acquisitionTime };
                })(),
                (async () => {
                    const { acquisitionTime, expirationTime } =
                        await secretsManagerClient.getToken();

                    return { "vaultTokenTTLms": expirationTime - acquisitionTime };
                })(),
            ]);

            dispatch(
                actions.fetchCompleted({
                    "runningServices": runningServicesRaw
                        .map(
                            ({
                                id: serviceId,
                                friendlyName,
                                packageName,
                                urls,
                                startedAt,
                                postInstallInstructions,
                                isShared,
                                env,
                                ownerUsername,
                                ...rest
                            }) => {
                                const common: RunningService.Common = {
                                    "id": serviceId,
                                    packageName,
                                    friendlyName,
                                    "logoUrl": getLogoUrl({ packageName }),
                                    "monitoringUrl": getMonitoringUrl({
                                        serviceId,
                                    }),
                                    startedAt,
                                    "vaultTokenExpirationTime":
                                        env["vault.enabled"] !== "true"
                                            ? undefined
                                            : startedAt + vaultTokenTTLms,
                                    "s3TokenExpirationTime":
                                        env["s3.enabled"] !== "true"
                                            ? undefined
                                            : startedAt + s3TokensTTLms,
                                    "urls": urls.sort(),
                                    "isStarting": !rest.isStarting
                                        ? false
                                        : (rest.prStarted.then(
                                              ({ isConfirmedJustStarted }) =>
                                                  dispatch(
                                                      actions.serviceStarted({
                                                          serviceId,
                                                          "doOverwriteStaredAtToNow":
                                                              isConfirmedJustStarted,
                                                      }),
                                                  ),
                                          ),
                                          true),
                                    postInstallInstructions,
                                    env,
                                };

                                const isOwned = ownerUsername === username;

                                if (!isOwned) {
                                    if (!isShared) {
                                        return undefined;
                                    }

                                    return id<RunningService.NotOwned>({
                                        ...common,
                                        isShared,
                                        isOwned,
                                        ownerUsername,
                                    });
                                }

                                return id<RunningService.Owned>({
                                    ...common,
                                    isShared,
                                    isOwned,
                                });
                            },
                        )
                        .filter(exclude(undefined)),
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
            : [...state["~internal"].runningServices].sort(
                  (a, b) => b.startedAt - a.startedAt,
              );
    };

    return { runningServices };
})();
