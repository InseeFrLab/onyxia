import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as projectManagement from "core/usecases/projectManagement";

export const thunks = {
    "setActive":
        (params: { helmReleaseName: string }) =>
        (...args) => {
            const { helmReleaseName } = params;

            const [dispatch] = args;

            let isActive = true;

            (async function periodicalRefresh() {
                if (!isActive) {
                    return;
                }

                try {
                    await dispatch(privateThunks.update({ helmReleaseName }));
                } catch (e) {
                    console.log("Pulling events and logs failed");
                }

                setTimeout(periodicalRefresh, 5_000);
            })();

            function setInactive() {
                isActive = false;
            }

            return { setInactive };
        }
} satisfies Thunks;

const privateThunks = {
    "update":
        (params: { helmReleaseName: string }) =>
        async (...args) => {
            const { helmReleaseName } = params;

            const [dispatch, getState, { onyxiaApi }] = args;

            {
                const state = getState()[name];

                if (state.isFetching && state.helmReleaseName === helmReleaseName) {
                    return;
                }
            }

            dispatch(actions.updateStarted({ helmReleaseName }));

            const helmReleases = await onyxiaApi.listHelmReleases();

            const helmRelease = helmReleases.find(
                helmRelease => helmRelease.helmReleaseName === helmReleaseName
            );

            if (helmRelease === undefined) {
                dispatch(actions.notifyHelmReleaseNoLongerExists());
                return;
            }

            const logsByPodName = Object.fromEntries(
                await Promise.all(
                    helmRelease.podNames.map(
                        async podName =>
                            [
                                podName,
                                await onyxiaApi.kubectlLogs({
                                    helmReleaseName,
                                    podName
                                })
                            ] as const
                    )
                )
            );

            const { namespace: kubernetesNamespace } =
                projectManagement.selectors.currentProject(getState());

            dispatch(
                actions.updateCompleted({
                    "helmReleaseFriendlyName":
                        helmRelease.friendlyName ?? helmRelease.helmReleaseName,
                    logsByPodName,
                    "helmValues": helmRelease.values,
                    "monitoringUrl": (() => {
                        const { helmReleaseName } = params;

                        const region =
                            deploymentRegionManagement.selectors.currentDeploymentRegion(
                                getState()
                            );

                        return region.servicesMonitoringUrlPattern
                            ?.replace("$NAMESPACE", kubernetesNamespace)
                            .replace("$INSTANCE", helmReleaseName.replace(/^\//, ""));
                    })()
                })
            );
        }
} satisfies Thunks;
