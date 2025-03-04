import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { assert, is } from "tsafe/assert";
import { id } from "tsafe/id";
import { exclude } from "tsafe/exclude";
import * as projectManagement from "core/usecases/projectManagement";
import { getServiceOpenUrl } from "./decoupledLogic/getServiceOpenUrl";

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
    servicePassword: string | undefined;
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

const services = createSelector(
    readyState,
    projectManagement.selectors.servicePassword,
    (state, projectServicePassword) => {
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
                          isShared: true,
                          isOwned: false,
                          ownerUsername: helmRelease.ownerUsername
                      }
                    : { isOwned: true, isShared: helmRelease.isShared };

                return { helmRelease, ownership } as const;
            })
            .filter(exclude(undefined))
            .map(
                ({ helmRelease, ownership }): Service => ({
                    helmReleaseName: helmRelease.helmReleaseName,
                    chartName: helmRelease.chartName,
                    ownership,
                    friendlyName: helmRelease.friendlyName ?? helmRelease.chartName,
                    iconUrl: logoUrlByReleaseName[helmRelease.helmReleaseName],
                    startedAt: helmRelease.startedAt,
                    openUrl: getServiceOpenUrl({ helmRelease }),
                    postInstallInstructions: helmRelease.postInstallInstructions,
                    servicePassword: (() => {
                        const { postInstallInstructions } = helmRelease;

                        from_notes: {
                            if (postInstallInstructions === undefined) {
                                break from_notes;
                            }

                            if (
                                postInstallInstructions.includes(projectServicePassword)
                            ) {
                                return projectServicePassword;
                            }

                            const regex = /password: ?([^\n ]+)/i;

                            const match = postInstallInstructions.match(regex);

                            if (match === null) {
                                break from_notes;
                            }

                            return match[1];
                        }

                        if (
                            JSON.stringify(helmRelease.values).includes(
                                projectServicePassword
                            )
                        ) {
                            return projectServicePassword;
                        }

                        let extractedPassword = id<string | undefined>(undefined);

                        JSON.stringify(helmRelease.values, (key, value) => {
                            assert(is<string>(value));

                            if (key.toLowerCase().endsWith("password")) {
                                extractedPassword = value;
                            }
                            return value;
                        });

                        if (extractedPassword !== undefined) {
                            return extractedPassword;
                        }

                        return undefined;
                    })(),
                    areInteractionLocked: lockedHelmReleaseNames.includes(
                        helmRelease.helmReleaseName
                    ),
                    state: (() => {
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
                    doesSupportSuspend: helmRelease.doesSupportSuspend
                })
            )
            .sort((a, b) => b.startedAt - a.startedAt);

        return services;
    }
);

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
    projectManagement.selectors.groupProjectName,
    (
        isReady,
        isUpdating,
        services,
        commandLogsEntries,
        isThereOwnedSharedServices,
        isThereNonOwnedServices,
        isThereDeletableServices,
        groupProjectName
    ) => {
        if (!isReady) {
            return {
                isUpdating,
                commandLogsEntries,
                services: [],
                isThereOwnedSharedServices,
                isThereNonOwnedServices,
                isThereDeletableServices,
                groupProjectName
            };
        }

        assert(services !== null);

        return {
            isUpdating,
            commandLogsEntries,
            services,
            isThereOwnedSharedServices,
            isThereNonOwnedServices,
            isThereDeletableServices,
            groupProjectName
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
