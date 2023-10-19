import { id } from "tsafe/id";
import * as deploymentRegion from "core/usecases/deploymentRegion";
import * as projectConfigs from "core/usecases/projectConfigs";
import type { Thunks } from "core/core";
import { exclude } from "tsafe/exclude";
import { createUsecaseContextApi } from "redux-clean-architecture";
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
                        action.sliceName === "projectConfigs" &&
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

            const runningServicesRaw = await onyxiaApi.getRunningServices();

            //NOTE: We do not have the catalog id nor the chart id so we search in every catalog.
            const { getLogoUrl } = await (async () => {
                const { catalogs, chartsByCatalogId } =
                    await onyxiaApi.getCatalogsAndCharts();

                function getLogoUrl(params: { chartName: string }): string | undefined {
                    const { chartName } = params;

                    for (const { id: catalogId } of catalogs) {
                        for (const {
                            name,
                            versions: [{ iconUrl }]
                        } of chartsByCatalogId[catalogId]) {
                            if (name === chartName) {
                                return iconUrl;
                            }
                        }
                    }
                    return undefined;
                }

                return { getLogoUrl };
            })();

            const { namespace: kubernetesNamespace } =
                projectConfigs.selectors.selectedProject(getState());

            const getMonitoringUrl = (params: { releaseName: string }) => {
                const { releaseName } = params;

                const region = deploymentRegion.selectors.selectedDeploymentRegion(
                    getState()
                );

                return region.servicesMonitoringUrlPattern
                    ?.replace("$NAMESPACE", kubernetesNamespace)
                    .replace("$INSTANCE", releaseName.replace(/^\//, ""));
            };

            const { username } = await onyxiaApi.getUser();

            const { s3TokensTTLms, vaultTokenTTLms } = await dispatch(
                privateThunks.getDefaultTokenTTL()
            );

            dispatch(
                actions.updateCompleted({
                    kubernetesNamespace,
                    "envByReleaseName": Object.fromEntries(
                        runningServicesRaw.map(({ releaseName, env }) => [
                            releaseName,
                            env
                        ])
                    ),
                    "postInstallInstructionsByReleaseName": Object.fromEntries(
                        runningServicesRaw
                            .map(({ releaseName, postInstallInstructions }) =>
                                postInstallInstructions === undefined
                                    ? undefined
                                    : [releaseName, postInstallInstructions]
                            )
                            .filter(exclude(undefined))
                    ),
                    "runningServices": runningServicesRaw
                        .map(
                            ({
                                releaseName,
                                friendlyName,
                                urls,
                                startedAt,
                                isShared,
                                ownerUsername,
                                env,
                                postInstallInstructions,
                                chartName,
                                ...rest
                            }) => {
                                const common: RunningService.Common = {
                                    releaseName,
                                    chartName,
                                    "friendlyName": friendlyName ?? releaseName,
                                    "chartIconUrl": getLogoUrl({ chartName }),
                                    "monitoringUrl": getMonitoringUrl({
                                        releaseName
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
                                                          releaseName,
                                                          "doOverwriteStaredAtToNow":
                                                              isConfirmedJustStarted
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
        (params: { releaseName: string }) =>
        async (...args) => {
            const { releaseName } = params;

            const [dispatch] = args;

            const onyxiaApi = dispatch(privateThunks.getLoggedOnyxiaApi());

            dispatch(actions.serviceStopped({ releaseName }));

            await onyxiaApi.stopService({ releaseName });
        },
    "getPostInstallInstructions":
        (params: { releaseName: string }) =>
        (...args): string => {
            const { releaseName } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            assert(state.stateDescription === "ready");

            const postInstallInstructions =
                state.postInstallInstructionsByReleaseName[releaseName];

            assert(postInstallInstructions !== undefined);

            dispatch(actions.postInstallInstructionsRequested({ releaseName }));

            return postInstallInstructions;
        },
    "getEnv":
        (params: { releaseName: string }) =>
        (...args): Record<string, string> => {
            const { releaseName } = params;

            const [dispatch, getState] = args;

            dispatch(actions.envRequested({ releaseName }));

            const state = getState()[name];

            assert(state.stateDescription === "ready");

            return state.envByReleaseName[releaseName];
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
                        "restrictToBucketName":
                            project.group === undefined ? undefined : project.bucket
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
        },
    "getLoggedOnyxiaApi":
        () =>
        (...args): OnyxiaApi => {
            const [dispatch, getState, extraArg] = args;

            const sliceContext = getContext(extraArg);

            {
                const { loggedOnyxiaApi } = sliceContext;
                if (loggedOnyxiaApi !== undefined) {
                    return loggedOnyxiaApi;
                }
            }

            const { onyxiaApi } = extraArg;

            sliceContext.loggedOnyxiaApi = {
                ...onyxiaApi,
                "getRunningServices": async () => {
                    const { namespace } = projectConfigs.selectors.selectedProject(
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

                    const runningServices = await onyxiaApi.getRunningServices();

                    dispatch(
                        actions.commandLogsRespUpdated({
                            cmdId,
                            "resp": formatHelmLsResp({
                                "lines": runningServices.map(
                                    ({
                                        releaseName,
                                        startedAt,
                                        revision,
                                        chartName,
                                        version,
                                        appVersion
                                    }) => ({
                                        "name": releaseName,
                                        namespace,
                                        revision,
                                        "updatedTime": startedAt,
                                        "status": "deployed",
                                        "chart": `${chartName}-${version}`,
                                        appVersion
                                    })
                                )
                            })
                        })
                    );

                    return runningServices;
                },
                "stopService": async ({ releaseName }) => {
                    const cmdId = Date.now();

                    dispatch(
                        actions.commandLogsEntryAdded({
                            "commandLogsEntry": {
                                cmdId,
                                "cmd": `helm uninstall ${releaseName} --namespace ${
                                    projectConfigs.selectors.selectedProject(getState())
                                        .namespace
                                }`,
                                "resp": undefined
                            }
                        })
                    );

                    await onyxiaApi.stopService({ releaseName });

                    dispatch(
                        actions.commandLogsRespUpdated({
                            cmdId,
                            "resp": `release "${releaseName}" uninstalled`
                        })
                    );
                }
            };

            return dispatch(privateThunks.getLoggedOnyxiaApi());
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    "prDefaultTokenTTL": id<
        Promise<{ s3TokensTTLms: number; vaultTokenTTLms: number }> | undefined
    >(undefined),
    "loggedOnyxiaApi": id<OnyxiaApi | undefined>(undefined)
}));
