import { assert } from "tsafe/assert";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { selectors as deploymentRegionSelectors } from "./deploymentRegion";
import { selectors as projectSelectionSelectors } from "./projectSelection";
import type { ThunkAction, State } from "../setup";
import { exclude } from "tsafe/exclude";
import { createUsecaseContextApi } from "redux-clean-architecture";

type RunningServicesState = {
    isUserWatching: boolean;
    isUpdating: boolean;
    "~internal": {
        /**NOTE: Access using selectors
         * undefined when not initially fetched */
        runningServices: undefined | RunningService[];
    };
};

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

export const name = "runningService";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<RunningServicesState>({
        "isUserWatching": false,
        "isUpdating": false,
        "~internal": {
            "runningServices": undefined
        }
    }),
    "reducers": {
        "isUserWatchingChanged": (
            state,
            { payload }: PayloadAction<{ isUserWatching: boolean }>
        ) => {
            const { isUserWatching } = payload;

            state.isUserWatching = isUserWatching;
        },
        "updateStarted": state => {
            state.isUpdating = true;
        },
        "updateCompleted": (
            state,
            { payload }: PayloadAction<{ runningServices: RunningService[] }>
        ) => {
            const { runningServices } = payload;

            return id<RunningServicesState>({
                "isUpdating": false,
                "isUserWatching": state.isUserWatching,
                "~internal": {
                    runningServices
                }
            });
        },
        "serviceStarted": (
            state,
            {
                payload
            }: PayloadAction<{
                serviceId: string;
                doOverwriteStaredAtToNow: boolean;
            }>
        ) => {
            const { serviceId, doOverwriteStaredAtToNow } = payload;
            const { runningServices } = state["~internal"];

            assert(runningServices !== undefined);

            const runningService = runningServices.find(({ id }) => id === serviceId);

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

            const { runningServices } = state["~internal"];
            assert(runningServices !== undefined);

            runningServices.splice(
                runningServices.findIndex(({ id }) => id === serviceId),
                1
            );
        }
    }
});

export const thunks = {
    "setIsUserWatching":
        (isUserWatching: boolean): ThunkAction<void> =>
        async (...args) => {
            const [dispatch] = args;

            dispatch(actions.isUserWatchingChanged({ isUserWatching }));
        },
    "update":
        (): ThunkAction<void> =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApiClient, userApiClient }] = args;

            {
                const state = getState().runningService;

                if (state.isUpdating) {
                    return;
                }
            }

            dispatch(actions.updateStarted());

            const runningServicesRaw = await onyxiaApiClient.getRunningServices();

            //NOTE: We do not have the catalog id so we search in every catalog.
            const { getLogoUrl } = await (async () => {
                const apiRequestResult = await onyxiaApiClient.getCatalogs();

                function getLogoUrl(params: { packageName: string }): string | undefined {
                    const { packageName } = params;

                    for (const { charts } of apiRequestResult) {
                        for (const { name, versions } of charts) {
                            if (name !== packageName) {
                                continue;
                            }
                            for (const { icon } of versions) {
                                if (icon === undefined) {
                                    continue;
                                }
                                return icon;
                            }
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

            const { s3TokensTTLms, vaultTokenTTLms } = await dispatch(
                privateThunks.getDefaultTokenTTL()
            );

            dispatch(
                actions.updateCompleted({
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
                                        serviceId
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
                                                              isConfirmedJustStarted
                                                      })
                                                  )
                                          ),
                                          true),
                                    postInstallInstructions,
                                    env
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
                                        ownerUsername
                                    });
                                }

                                return id<RunningService.Owned>({
                                    ...common,
                                    isShared,
                                    isOwned
                                });
                            }
                        )
                        .filter(exclude(undefined))
                })
            );
        },
    "stopService":
        (params: { serviceId: string }): ThunkAction<void> =>
        async (...args) => {
            const { serviceId } = params;

            const [dispatch, , { onyxiaApiClient }] = args;

            dispatch(actions.serviceStopped({ serviceId }));

            await onyxiaApiClient.stopService({ serviceId });
        }
};

export const privateThunks = {
    "initialize":
        (): ThunkAction<void> =>
        async (...args) => {
            const [dispatch, getState, { evtAction }] = args;

            evtAction.attach(
                event =>
                    event.sliceName === "runningService" &&
                    event.actionName === "isUserWatchingChanged" &&
                    event.payload.isUserWatching,
                () => dispatch(thunks.update())
            );

            evtAction.attach(
                event =>
                    event.sliceName === "projectSelection" &&
                    event.actionName === "projectChanged" &&
                    getState().runningService.isUserWatching,
                async () => {
                    if (getState().runningService.isUpdating) {
                        await evtAction.waitFor(
                            event =>
                                event.sliceName === "runningService" &&
                                event.actionName === "updateCompleted"
                        );
                    }

                    dispatch(thunks.update());
                }
            );
        },
    /** We ask tokens just to tel how long is their lifespan */
    "getDefaultTokenTTL":
        (): ThunkAction<Promise<{ s3TokensTTLms: number; vaultTokenTTLms: number }>> =>
        async (...args) => {
            const [, getState, extraArgs] = args;

            const sliceContext = getContext(extraArgs);

            if (sliceContext.prDefaultTokenTTL !== undefined) {
                return sliceContext.prDefaultTokenTTL;
            }

            const { s3Client, secretsManagerClient } = extraArgs;

            return (sliceContext.prDefaultTokenTTL = Promise.all([
                (async () => {
                    const project = projectSelectionSelectors.selectedProject(getState());

                    const isDefaultProject =
                        getState().projectSelection.projects[0].id === project.id;

                    const { expirationTime, acquisitionTime } = await s3Client.getToken({
                        "restrictToBucketName": isDefaultProject
                            ? undefined
                            : project.bucket
                    });

                    return { "s3TokensTTLms": expirationTime - acquisitionTime };
                })(),
                (async () => {
                    const { acquisitionTime, expirationTime } =
                        await secretsManagerClient.getToken();

                    return { "vaultTokenTTLms": expirationTime - acquisitionTime };
                })()
            ]).then(([{ s3TokensTTLms }, { vaultTokenTTLms }]) => ({
                s3TokensTTLms,
                vaultTokenTTLms
            })));
        }
};

type SliceContext = {
    prDefaultTokenTTL:
        | Promise<{ s3TokensTTLms: number; vaultTokenTTLms: number }>
        | undefined;
};

const { getContext } = createUsecaseContextApi<SliceContext>(() => ({
    "prDefaultTokenTTL": undefined
}));

export const selectors = (() => {
    const runningServices = (rootState: State): RunningService[] => {
        const { runningServices } = rootState.runningService["~internal"];

        return runningServices === undefined
            ? []
            : [...runningServices].sort((a, b) => b.startedAt - a.startedAt);
    };

    return { runningServices };
})();
