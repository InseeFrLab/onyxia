import { id } from "tsafe/id";
import * as projectManagement from "core/usecases/projectManagement";
import type { Thunks } from "core/bootstrap";
import { exclude } from "tsafe/exclude";
import { createUsecaseContextApi } from "clean-architecture";
import { assert, type Equals } from "tsafe/assert";
import { Evt, type Ctx } from "evt";
import { name, actions } from "./state";
import type { RunningService } from "./state";
import type { OnyxiaApi } from "core/ports/OnyxiaApi";
import { formatHelmLsResp } from "./utils/formatHelmCommands";
import * as viewQuotas from "core/usecases/viewQuotas";
import { protectedSelectors } from "./selectors";

export const thunks = {
    "setActive":
        () =>
        (...args) => {
            const [dispatch, getState, { evtAction, onyxiaApi }] = args;

            const ctx = Evt.newCtx();

            evtAction
                .pipe(
                    ctx,
                    action =>
                        action.usecaseName === "projectManagement" &&
                        action.actionName === "projectChanged"
                )
                .toStateful()
                .attach(() => dispatch(thunks.update()));

            evtAction.attach(
                action =>
                    action.usecaseName === "viewQuotas" &&
                    action.actionName === "isOnlyNonNegligibleQuotasToggled" &&
                    viewQuotas.protectedSelectors.isOnlyNonNegligibleQuotas(
                        getState()
                    ) === false,
                ctx,
                () => {
                    const commandLogsEntry =
                        viewQuotas.protectedSelectors.commandLogsEntry(getState());

                    assert(commandLogsEntry !== undefined);

                    dispatch(actions.commandLogsEntryAdded({ commandLogsEntry }));
                }
            );

            let ctxInner_prev: Ctx<void> | undefined = undefined;

            evtAction
                .pipe(
                    ctx,
                    action =>
                        action.usecaseName === name &&
                        action.actionName === "updateCompleted"
                )
                .toStateful()
                .attach(
                    () => protectedSelectors.isReady(getState()),
                    async () => {
                        if (ctxInner_prev !== undefined) {
                            ctxInner_prev.done();
                        }

                        const ctxInner = Evt.newCtx();

                        ctxInner_prev = ctxInner;

                        ctx.evtDoneOrAborted.attachOnce(ctxInner, () => ctxInner.done());

                        evtAction.attachOnce(
                            action =>
                                action.usecaseName === name &&
                                action.actionName === "updateStarted",
                            ctxInner,
                            () => {
                                ctxInner.done();
                            }
                        );

                        await (async function monitorServicesStartupStatus() {
                            const startingRunningServiceHelmReleaseNames =
                                protectedSelectors.startingRunningServiceHelmReleaseNames(
                                    getState()
                                );

                            if (startingRunningServiceHelmReleaseNames.length === 0) {
                                return;
                            }

                            await new Promise(resolve => setTimeout(resolve, 3_000));

                            if (ctxInner.completionStatus) {
                                return;
                            }

                            const helmReleases = await onyxiaApi
                                .listHelmReleases()
                                .catch(() => undefined);

                            if (helmReleases === undefined) {
                                return monitorServicesStartupStatus();
                            }

                            if (ctxInner.completionStatus) {
                                return;
                            }

                            let hasNonStartedHelmRelease = false;

                            startingRunningServiceHelmReleaseNames.forEach(
                                helmReleaseName => {
                                    const helmRelease = helmReleases.find(
                                        helmRelease =>
                                            helmRelease.helmReleaseName ===
                                            helmReleaseName
                                    );

                                    if (helmRelease === undefined) {
                                        return;
                                    }

                                    if (
                                        helmRelease.status === "deployed" &&
                                        helmRelease.areAllTasksReady
                                    ) {
                                        dispatch(
                                            actions.statusUpdated({
                                                helmReleaseName,
                                                "status": helmRelease.status,
                                                "areAllTasksReady":
                                                    helmRelease.areAllTasksReady
                                            })
                                        );

                                        return;
                                    }

                                    hasNonStartedHelmRelease = true;
                                }
                            );

                            if (!hasNonStartedHelmRelease) {
                                return;
                            }

                            return monitorServicesStartupStatus();
                        })();

                        ctxInner.done();
                    }
                );

            function setInactive() {
                ctx.done();
            }

            return { setInactive };
        },
    "update":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            {
                const state = getState()[name];

                if (state.isUpdating) {
                    return;
                }
            }

            dispatch(actions.updateStarted());

            const onyxiaApi = dispatch(privateThunks.getLoggedOnyxiaApi());

            const helmReleases = await onyxiaApi.listHelmReleases();

            //NOTE: We do not have the catalog id nor the chart id so we search in every catalog.
            const { getLogoUrl } = await (async () => {
                const { catalogs, chartsByCatalogId } =
                    await onyxiaApi.getCatalogsAndCharts();

                function getLogoUrl(params: {
                    chartName: string;
                    chartVersion: string;
                }): string | undefined {
                    const { chartName, chartVersion } = params;

                    catalog: for (const { id: catalogId } of catalogs) {
                        for (const chart of chartsByCatalogId[catalogId]) {
                            if (chart.name === chartName) {
                                const iconUrl = chart.versions.find(
                                    ({ version }) => version === chartVersion
                                )?.iconUrl;

                                if (iconUrl === undefined) {
                                    const { iconUrl } = chart.versions[0] ?? {};
                                    if (iconUrl !== undefined) {
                                        return iconUrl;
                                    }

                                    continue catalog;
                                }

                                return iconUrl;
                            }
                        }
                    }
                    return undefined;
                }

                return { getLogoUrl };
            })();

            const { namespace: kubernetesNamespace } =
                projectManagement.selectors.currentProject(getState());

            const {
                user: { username }
            } = await onyxiaApi.getUserAndProjects();

            const runningServices: RunningService[] = helmReleases
                .map(
                    ({
                        helmReleaseName,
                        friendlyName,
                        urls,
                        startedAt,
                        isShared,
                        ownerUsername,
                        postInstallInstructions,
                        chartName,
                        chartVersion,
                        areAllTasksReady,
                        status,
                        canBeSuspended,
                        isSuspended
                    }) => {
                        const isOwned = ownerUsername === username;

                        if (!isOwned && !isShared) {
                            return undefined;
                        }

                        return id<RunningService>({
                            helmReleaseName,
                            chartName,
                            "friendlyName": friendlyName ?? helmReleaseName,
                            "chartIconUrl": getLogoUrl({
                                chartName,
                                chartVersion
                            }),
                            startedAt,
                            "urls": urls.sort(),
                            status,
                            areAllTasksReady,
                            "hasPostInstallInstructions":
                                postInstallInstructions !== undefined,
                            "ownership": isOwned
                                ? {
                                      "isOwned": true,
                                      isShared
                                  }
                                : {
                                      "isOwned": false,
                                      "isShared": true,
                                      ownerUsername
                                  },
                            "suspendState": !canBeSuspended
                                ? {
                                      "canBeSuspended": false
                                  }
                                : {
                                      "canBeSuspended": true,
                                      isSuspended,
                                      "isTransitioning": false
                                  }
                        });
                    }
                )
                .filter(exclude(undefined));

            dispatch(
                actions.updateCompleted({
                    kubernetesNamespace,
                    "postInstallInstructionsByHelmReleaseName": Object.fromEntries(
                        helmReleases
                            .map(({ helmReleaseName, postInstallInstructions }) =>
                                postInstallInstructions === undefined
                                    ? undefined
                                    : [helmReleaseName, postInstallInstructions]
                            )
                            .filter(exclude(undefined))
                    ),
                    runningServices
                })
            );
        },
    "stopService":
        (params: { helmReleaseName: string }) =>
        async (...args) => {
            const { helmReleaseName } = params;

            const [dispatch] = args;

            const onyxiaApi = dispatch(privateThunks.getLoggedOnyxiaApi());

            dispatch(actions.serviceStopped({ helmReleaseName }));

            await onyxiaApi.helmUninstall({ helmReleaseName });
        },
    "suspendOrResumeService":
        (params: { helmReleaseName: string; action: "suspend" | "resume" }) =>
        async (...args) => {
            const { helmReleaseName, action } = params;

            const [dispatch, , { onyxiaApi }] = args;

            const isSuspendAction = (() => {
                switch (action) {
                    case "suspend":
                        return true;
                    case "resume":
                        return false;
                }
                assert<Equals<typeof action, never>>(false);
            })();

            dispatch(actions.suspendOrResumeServiceStarted({ helmReleaseName }));

            await onyxiaApi.helmUpgradeGlobalSuspend({
                helmReleaseName,
                "value": isSuspendAction
            });

            dispatch(
                actions.suspendOrResumeServiceCompleted({
                    helmReleaseName,
                    "isSuspended": isSuspendAction
                })
            );

            dispatch(thunks.update());
        },
    "getPostInstallInstructions":
        (params: { helmReleaseName: string }) =>
        (...args): string => {
            const { helmReleaseName } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            assert(state.stateDescription === "ready");

            const postInstallInstructions =
                state.postInstallInstructionsByHelmReleaseName[helmReleaseName];

            assert(postInstallInstructions !== undefined);

            dispatch(actions.postInstallInstructionsRequested({ helmReleaseName }));

            return postInstallInstructions;
        }
} satisfies Thunks;

const privateThunks = {
    "getLoggedOnyxiaApi":
        () =>
        (...args): OnyxiaApi => {
            const [dispatch, getState, rootContext] = args;

            const context = getContext(rootContext);

            {
                const { loggedOnyxiaApi } = context;
                if (loggedOnyxiaApi !== undefined) {
                    return loggedOnyxiaApi;
                }
            }

            const { onyxiaApi } = rootContext;

            context.loggedOnyxiaApi = {
                ...onyxiaApi,
                "listHelmReleases": async () => {
                    const { namespace } =
                        projectManagement.selectors.currentProject(getState());

                    const cmdId = Date.now();

                    dispatch(
                        actions.commandLogsEntryAdded({
                            "commandLogsEntry": {
                                cmdId,
                                "cmd": `helm list --namespace ${namespace}`,
                                "resp": undefined
                            }
                        })
                    );

                    const helmReleases = await onyxiaApi.listHelmReleases();

                    dispatch(
                        actions.commandLogsRespUpdated({
                            cmdId,
                            "resp": formatHelmLsResp({
                                "lines": helmReleases.map(
                                    ({
                                        helmReleaseName,
                                        startedAt,
                                        revision,
                                        chartName,
                                        chartVersion,
                                        appVersion,
                                        status
                                    }) => ({
                                        "name": helmReleaseName,
                                        namespace,
                                        revision,
                                        "updatedTime": startedAt,
                                        "status": status,
                                        "chart": `${chartName}-${chartVersion}`,
                                        appVersion
                                    })
                                )
                            })
                        })
                    );

                    return helmReleases;
                },
                "helmUninstall": async ({ helmReleaseName }) => {
                    const cmdId = Date.now();

                    dispatch(
                        actions.commandLogsEntryAdded({
                            "commandLogsEntry": {
                                cmdId,
                                "cmd": `helm uninstall ${helmReleaseName} --namespace ${
                                    projectManagement.selectors.currentProject(getState())
                                        .namespace
                                }`,
                                "resp": undefined
                            }
                        })
                    );

                    await onyxiaApi.helmUninstall({ helmReleaseName });

                    dispatch(
                        actions.commandLogsRespUpdated({
                            cmdId,
                            "resp": `release "${helmReleaseName}" uninstalled`
                        })
                    );
                }
            };

            return dispatch(privateThunks.getLoggedOnyxiaApi());
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    "loggedOnyxiaApi": id<OnyxiaApi | undefined>(undefined)
}));
