import { id } from "tsafe/id";
import * as projectManagement from "core/usecases/projectManagement";
import type { Thunks } from "core/bootstrap";
import { createUsecaseContextApi } from "clean-architecture";
import { assert } from "tsafe/assert";
import { Evt, type Ctx } from "evt";
import { name, actions } from "./state";
import type { OnyxiaApi } from "core/ports/OnyxiaApi";
import { formatHelmLsResp } from "./utils/formatHelmCommands";
import * as viewQuotas from "core/usecases/viewQuotas";
import { protectedSelectors } from "./selectors";

export const thunks = {
    "setActive":
        () =>
        (...args) => {
            const [dispatch, getState, { evtAction }] = args;

            const ctx = Evt.newCtx();

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

            evtAction
                .pipe(
                    ctx,
                    action =>
                        action.usecaseName === "projectManagement" &&
                        action.actionName === "projectChanged"
                )
                .toStateful()
                .attach(() => dispatch(thunks.update()));

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

                        await (async function scheduleUpdate() {
                            const shouldKeepRefreshing =
                                protectedSelectors.shouldKeepRefreshing(getState());

                            if (!shouldKeepRefreshing) {
                                return;
                            }

                            await new Promise(resolve => setTimeout(resolve, 3_000));

                            if (ctxInner.completionStatus) {
                                return;
                            }

                            dispatch(
                                privateThunks.update({ "doLogInCommandBar": false })
                            );

                            if (ctxInner.completionStatus) {
                                return;
                            }

                            return scheduleUpdate();
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
            const [dispatch] = args;

            await dispatch(privateThunks.update({ "doLogInCommandBar": true }));
        },
    "deleteService":
        (params: { helmReleaseName: string }) =>
        async (...args) => {
            const { helmReleaseName } = params;

            const [dispatch] = args;

            dispatch(
                actions.helmReleaseLocked({
                    helmReleaseName,
                    "reason": "delete"
                })
            );

            const onyxiaApi = dispatch(privateThunks.getLoggedOnyxiaApi());

            await onyxiaApi.helmUninstall({ helmReleaseName });

            dispatch(actions.helmReleaseUnlocked({ helmReleaseName }));

            await dispatch(thunks.update());
        },
    "deleteAllServices":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const services = protectedSelectors.services(getState());

            if (services === undefined) {
                return;
            }

            await Promise.all(
                services.map(({ helmReleaseName, ownership, areInteractionLocked }) => {
                    if (!ownership.isOwned) {
                        return;
                    }

                    if (areInteractionLocked) {
                        return;
                    }

                    return dispatch(thunks.deleteService({ helmReleaseName }));
                })
            );
        },
    "suspendOrResumeService":
        (params: { helmReleaseName: string }) =>
        async (...args) => {
            const { helmReleaseName } = params;

            const [dispatch, getState, { onyxiaApi }] = args;

            dispatch(
                actions.helmReleaseLocked({
                    helmReleaseName,
                    "reason": "suspend"
                })
            );

            const state = getState()[name];

            assert(state.stateDescription === "ready");

            const helmRelease = state.helmReleases.find(
                helmRelease => helmRelease.helmReleaseName === helmReleaseName
            );

            assert(helmRelease !== undefined);

            await onyxiaApi.helmUpgradeGlobalSuspend({
                helmReleaseName,
                "value": !helmRelease.isSuspended
            });

            await dispatch(thunks.update());

            dispatch(actions.helmReleaseUnlocked({ helmReleaseName }));
        },
    "logHelmGetNotes":
        (params: { helmReleaseName: string }) =>
        (...args) => {
            const { helmReleaseName } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            assert(state.stateDescription === "ready");

            const helmRelease = state.helmReleases.find(
                ({ helmReleaseName: helmReleaseName_ }) =>
                    helmReleaseName_ === helmReleaseName
            );

            assert(helmRelease !== undefined);

            const { postInstallInstructions } = helmRelease;

            assert(postInstallInstructions !== undefined);

            dispatch(
                actions.commandLogsEntryAdded({
                    "commandLogsEntry": {
                        "cmdId": Date.now(),
                        "cmd": `helm get notes ${helmReleaseName} --namespace ${state.kubernetesNamespace}`,
                        "resp": postInstallInstructions
                    }
                })
            );
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
        },
    "update":
        (params: { doLogInCommandBar: boolean }) =>
        async (...args) => {
            const { doLogInCommandBar } = params;

            const [dispatch, getState, rootContext] = args;

            {
                const state = getState()[name];

                if (state.isUpdating) {
                    return;
                }
            }

            dispatch(actions.updateStarted());

            const onyxiaApi = doLogInCommandBar
                ? dispatch(privateThunks.getLoggedOnyxiaApi())
                : rootContext.onyxiaApi;

            const { getLogoUrl } = await (async () => {
                const { chartsByCatalogId } = await onyxiaApi.getCatalogsAndCharts();

                function getLogoUrl(params: {
                    catalogId: string;
                    chartName: string;
                    chartVersion: string;
                }): string | undefined {
                    const { catalogId, chartName, chartVersion } = params;

                    const catalogCharts = chartsByCatalogId[catalogId];

                    if (catalogCharts === undefined) {
                        return undefined;
                    }

                    const chart = catalogCharts.find(chart => chart.name === chartName);

                    if (chart === undefined) {
                        return undefined;
                    }

                    const version = chart.versions.find(
                        ({ version }) => version === chartVersion
                    );

                    if (version === undefined) {
                        return undefined;
                    }

                    return version.iconUrl;
                }

                return { getLogoUrl };
            })();

            const helmReleases = await onyxiaApi.listHelmReleases();

            const { namespace: kubernetesNamespace } =
                projectManagement.selectors.currentProject(getState());

            const {
                user: { username }
            } = await onyxiaApi.getUserAndProjects();

            dispatch(
                actions.updateCompleted({
                    kubernetesNamespace,
                    helmReleases,
                    "logoUrlByReleaseName": Object.fromEntries(
                        helmReleases.map(helmRelease => [
                            helmRelease.helmReleaseName,
                            getLogoUrl({
                                "catalogId": helmRelease.catalogId,
                                "chartName": helmRelease.chartName,
                                "chartVersion": helmRelease.chartVersion
                            })
                        ])
                    ),
                    username
                })
            );
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    "loggedOnyxiaApi": id<OnyxiaApi | undefined>(undefined)
}));
