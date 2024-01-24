import { id } from "tsafe/id";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as projectManagement from "core/usecases/projectManagement";
import type { Thunks } from "core/bootstrap";
import { exclude } from "tsafe/exclude";
import { createUsecaseContextApi } from "clean-architecture";
import { assert } from "tsafe/assert";
import { Evt } from "evt";
import { name, actions } from "../state";
import type { RunningService } from "../state";
import type { OnyxiaApi } from "core/ports/OnyxiaApi";
import { formatHelmLsResp } from "./formatHelmCommands";

export const thunks = {
    "setActive":
        () =>
        (...args) => {
            const [dispatch, , { evtAction }] = args;

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

            const getMonitoringUrl = (params: { helmReleaseName: string }) => {
                const { helmReleaseName } = params;

                const region =
                    deploymentRegionManagement.selectors.currentDeploymentRegion(
                        getState()
                    );

                return region.servicesMonitoringUrlPattern
                    ?.replace("$NAMESPACE", kubernetesNamespace)
                    .replace("$INSTANCE", helmReleaseName.replace(/^\//, ""));
            };

            const {
                user: { username }
            } = await onyxiaApi.getUserAndProjects();

            dispatch(
                actions.updateCompleted({
                    kubernetesNamespace,
                    "envByHelmReleaseName": Object.fromEntries(
                        helmReleases.map(({ helmReleaseName, env }) => [
                            helmReleaseName,
                            env
                        ])
                    ),
                    "postInstallInstructionsByHelmReleaseName": Object.fromEntries(
                        helmReleases
                            .map(({ helmReleaseName, postInstallInstructions }) =>
                                postInstallInstructions === undefined
                                    ? undefined
                                    : [helmReleaseName, postInstallInstructions]
                            )
                            .filter(exclude(undefined))
                    ),
                    "runningServices": helmReleases
                        .map(
                            ({
                                helmReleaseName,
                                friendlyName,
                                urls,
                                startedAt,
                                isShared,
                                ownerUsername,
                                env,
                                postInstallInstructions,
                                chartName,
                                chartVersion,
                                ...rest
                            }) => {
                                const common: RunningService.Common = {
                                    helmReleaseName,
                                    chartName,
                                    "friendlyName": friendlyName ?? helmReleaseName,
                                    "chartIconUrl": getLogoUrl({
                                        chartName,
                                        chartVersion
                                    }),
                                    "monitoringUrl": getMonitoringUrl({
                                        helmReleaseName
                                    }),
                                    startedAt,
                                    "urls": urls.sort(),
                                    "isStarting": !rest.isStarting
                                        ? false
                                        : (rest.prStarted.then(() =>
                                              dispatch(
                                                  actions.serviceStarted({
                                                      helmReleaseName
                                                  })
                                              )
                                          ),
                                          true),
                                    "hasPostInstallInstructions":
                                        postInstallInstructions !== undefined
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
        (params: { helmReleaseName: string }) =>
        async (...args) => {
            const { helmReleaseName } = params;

            const [dispatch] = args;

            const onyxiaApi = dispatch(privateThunks.getLoggedOnyxiaApi());

            dispatch(actions.serviceStopped({ helmReleaseName }));

            await onyxiaApi.helmUninstall({ helmReleaseName });
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
        },
    "getEnv":
        (params: { helmReleaseName: string }) =>
        (...args): Record<string, string> => {
            const { helmReleaseName } = params;

            const [dispatch, getState] = args;

            dispatch(actions.envRequested({ helmReleaseName }));

            const state = getState()[name];

            assert(state.stateDescription === "ready");

            return state.envByHelmReleaseName[helmReleaseName];
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
                    const { namespace } = projectManagement.selectors.currentProject(
                        getState()
                    );

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
                                        appVersion
                                    }) => ({
                                        "name": helmReleaseName,
                                        namespace,
                                        revision,
                                        "updatedTime": startedAt,
                                        "status": "deployed",
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
