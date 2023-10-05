import { id } from "tsafe/id";
import * as deploymentRegion from "../deploymentRegion";
import * as projectConfigs from "../projectConfigs";
import type { Thunks } from "core/core";
import { exclude } from "tsafe/exclude";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { Evt } from "evt";
import { name, actions } from "./state";
import type { RunningService } from "./state";

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
            const [dispatch, getState, { onyxiaApi }] = args;

            {
                const state = getState()[name];

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

            const { username } = await onyxiaApi.getUser();

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
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    "prDefaultTokenTTL": id<
        Promise<{ s3TokensTTLms: number; vaultTokenTTLms: number }> | undefined
    >(undefined)
}));
