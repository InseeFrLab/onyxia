import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { assert } from "tsafe/assert";
import { exclude } from "tsafe/exclude";

const state = (rootState: RootState) => rootState[name];

const readyState = createSelector(state, state => {
    if (state.stateDescription !== "ready") {
        return null;
    }

    return state;
});

const isReady = createSelector(state, state => state.stateDescription === "ready");

export type Service = {
    helmReleaseName: string;
    chartName: string;
    friendlyName: string;
    iconUrl: string | undefined;
    startedAt: number;
    openUrl: string | undefined;
    postInstallInstructions: string | undefined;
    areInteractionLocked: boolean;
    state: "starting" | "suspending" | "suspended" | "running" | "failed";
    ownership:
        | {
              isOwned: true;
              isShared: boolean | undefined;
          }
        | {
              isShared: true;
              isOwned: false;
              ownerUsername: string;
          };
    doesSupportSuspend: boolean;
};

const services = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    const { helmReleases, lockedHelmReleaseNames, logoUrlByReleaseName, username } =
        state;

    const services = helmReleases
        .map(helmRelease => {
            const isOwned = helmRelease.ownerUsername === username;
            if (!isOwned && !helmRelease.isShared) {
                return undefined;
            }

            //const ownership = !isOwned ? "notOwned" : helmRelease.isShared ? "ownedShared" : "owned";
            const ownership: Service["ownership"] = !isOwned
                ? {
                      "isShared": true,
                      "isOwned": false,
                      "ownerUsername": helmRelease.ownerUsername
                  }
                : { "isOwned": true, "isShared": helmRelease.isShared };

            return { helmRelease, ownership } as const;
        })
        .filter(exclude(undefined))
        .map(
            ({ helmRelease, ownership }): Service => ({
                "helmReleaseName": helmRelease.helmReleaseName,
                "chartName": helmRelease.chartName,
                ownership,
                "friendlyName": helmRelease.friendlyName ?? helmRelease.chartName,
                "iconUrl": logoUrlByReleaseName[helmRelease.helmReleaseName],
                "startedAt": helmRelease.startedAt,
                "openUrl": [...helmRelease.urls].sort()[0],
                "postInstallInstructions": helmRelease.postInstallInstructions,
                "areInteractionLocked": lockedHelmReleaseNames.includes(
                    helmRelease.helmReleaseName
                ),
                "state": (() => {
                    if (helmRelease.status === "failed") {
                        return "failed";
                    }

                    if (helmRelease.status === "pending-install") {
                        return "starting";
                    }

                    if (helmRelease.isSuspended) {
                        return helmRelease.podNames.length === 0
                            ? "suspended"
                            : "suspending";
                    }

                    return helmRelease.areAllTasksReady ? "running" : "starting";
                })(),
                "doesSupportSuspend": helmRelease.doesSupportSuspend
            })
        )
        .sort((a, b) => b.startedAt - a.startedAt);

    return services;
});

const isUpdating = createSelector(state, state => {
    const { isUpdating } = state;
    return isUpdating;
});

const commandLogsEntries = createSelector(state, state => state.commandLogsEntries);

const isThereOwnedSharedServices = createSelector(services, services => {
    if (services === null) {
        return false;
    }

    return services.some(
        service => service.ownership.isOwned && service.ownership.isShared
    );
});

const isThereNonOwnedServices = createSelector(services, services => {
    if (services === null) {
        return false;
    }

    return services.some(service => !service.ownership.isOwned);
});

const isThereDeletableServices = createSelector(services, services => {
    if (services === null) {
        return false;
    }

    return services.some(service => service.ownership.isOwned);
});

const main = createSelector(
    isReady,
    isUpdating,
    services,
    commandLogsEntries,
    isThereOwnedSharedServices,
    isThereNonOwnedServices,
    isThereDeletableServices,
    (
        isReady,
        isUpdating,
        services,
        commandLogsEntries,
        isThereOwnedSharedServices,
        isThereNonOwnedServices,
        isThereDeletableServices
    ) => {
        if (!isReady) {
            return {
                isUpdating,
                commandLogsEntries,
                "services": [],
                isThereOwnedSharedServices,
                isThereNonOwnedServices,
                isThereDeletableServices
            };
        }

        assert(services !== null);

        return {
            isUpdating,
            commandLogsEntries,
            services,
            isThereOwnedSharedServices,
            isThereNonOwnedServices,
            isThereDeletableServices
        };
    }
);

export const selectors = {
    main
};

const shouldKeepRefreshing = createSelector(services, services => {
    assert(services !== null);

    return services.some(
        service => service.state === "starting" || service.state === "suspending"
    );
});

export const protectedSelectors = {
    isReady,
    services,
    shouldKeepRefreshing
};
