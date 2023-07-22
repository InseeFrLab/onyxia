import { assert } from "tsafe/assert";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import * as deploymentRegion from "./deploymentRegion";
import * as projectConfigs from "./projectConfigs";
import type { Thunks, State as RootState } from "../core";
import { exclude } from "tsafe/exclude";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { createSelector } from "@reduxjs/toolkit";

type State = {
    isUserWatching: boolean;
    isUpdating: boolean;
    runningServices: undefined | RunningService[];
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
    "initialState": id<State>({
        "isUserWatching": false,
        "isUpdating": false,
        "runningServices": undefined
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

            return id<State>({
                "isUpdating": false,
                "isUserWatching": state.isUserWatching,
                runningServices
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
            const { runningServices } = state;

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

            const { runningServices } = state;
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
        (isUserWatching: boolean) =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.isUserWatchingChanged({ isUserWatching }));
        },
    "update":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi, getUser }] = args;

            {
                const state = getState().runningService;

                if (state.isUpdating) {
                    return;
                }
            }

            dispatch(actions.updateStarted());

            const runningServicesRaw = await onyxiaApi.getRunningServices();

            //NOTE: We do not have the catalog id so we search in every catalog.
            const { getLogoUrl } = await (async () => {
                const apiRequestResult = await onyxiaApi.getCatalogs();

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

                const project = projectConfigs.selectors.selectedProject(getState());

                const selectedDeploymentRegion =
                    deploymentRegion.selectors.selectedDeploymentRegion(getState());

                return selectedDeploymentRegion.servicesMonitoringUrlPattern
                    ?.replace("$NAMESPACE", project.namespace)
                    .replace("$INSTANCE", serviceId.replace(/^\//, ""));
            };

            const { username } = await getUser();

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
        (params: { serviceId: string }) =>
        async (...args) => {
            const { serviceId } = params;

            const [dispatch, , { onyxiaApi }] = args;

            dispatch(actions.serviceStopped({ serviceId }));

            await onyxiaApi.stopService({ serviceId });
        }
} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
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
                    event.sliceName === "projectConfigs" &&
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
        }
} satisfies Thunks;

const privateThunks = {
    /** We ask tokens just to tel how long is their lifespan */
    "getDefaultTokenTTL":
        () =>
        async (...args): Promise<{ s3TokensTTLms: number; vaultTokenTTLms: number }> => {
            const [, getState, extraArgs] = args;

            const sliceContext = getContext(extraArgs);

            if (sliceContext.prDefaultTokenTTL !== undefined) {
                return sliceContext.prDefaultTokenTTL;
            }

            const { s3Client, secretsManager } = extraArgs;

            return (sliceContext.prDefaultTokenTTL = Promise.all([
                (async () => {
                    const project = projectConfigs.selectors.selectedProject(getState());

                    const { expirationTime, acquisitionTime } = await s3Client.getToken({
                        "restrictToBucketName": project.isDefault
                            ? undefined
                            : project.bucket
                    });

                    return { "s3TokensTTLms": expirationTime - acquisitionTime };
                })(),
                (async () => {
                    const { acquisitionTime, expirationTime } =
                        await secretsManager.getToken();

                    return { "vaultTokenTTLms": expirationTime - acquisitionTime };
                })()
            ]).then(([{ s3TokensTTLms }, { vaultTokenTTLms }]) => ({
                s3TokensTTLms,
                vaultTokenTTLms
            })));
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    "prDefaultTokenTTL": id<
        Promise<{ s3TokensTTLms: number; vaultTokenTTLms: number }> | undefined
    >(undefined)
}));

export const selectors = (() => {
    const runningServices = (rootState: RootState): RunningService[] | undefined => {
        const { runningServices } = rootState[name];

        if (runningServices === undefined) {
            return undefined;
        }

        return [...runningServices].sort((a, b) => b.startedAt - a.startedAt);
    };

    const isUpdating = (rootState: RootState): boolean => {
        const { isUpdating } = rootState[name];
        return isUpdating;
    };

    const deletableRunningServices = createSelector(runningServices, runningServices =>
        (runningServices ?? []).filter(({ isOwned }) => isOwned)
    );

    const isThereNonOwnedServices = createSelector(
        runningServices,
        runningServices =>
            (runningServices ?? []).find(({ isOwned }) => !isOwned) !== undefined
    );

    const isThereOwnedSharedServices = createSelector(
        runningServices,
        runningServices =>
            (runningServices ?? []).find(
                ({ isOwned, isShared }) => isOwned && isShared
            ) !== undefined
    );

    return {
        runningServices,
        deletableRunningServices,
        isUpdating,
        isThereNonOwnedServices,
        isThereOwnedSharedServices
    };
})();
