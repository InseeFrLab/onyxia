import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as projectManagement from "core/usecases/projectManagement";
import { protectedSelectors } from "./selectors";
import { assert } from "tsafe/assert";

export const thunks = {
    setActive:
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

                setTimeout(periodicalRefresh, 10_000);
            })();

            function setInactive() {
                isActive = false;
            }

            return { setInactive };
        },
    changeSelectedPod:
        (params: { podName: string }) =>
        (...args) => {
            const { podName } = params;

            const [dispatch] = args;

            dispatch(actions.selectedPodChanged({ podName }));
        },
    toggleHelmValues:
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            {
                const isCommandBarExpanded =
                    protectedSelectors.isCommandBarExpanded(getState());

                assert(isCommandBarExpanded !== undefined);

                if (isCommandBarExpanded) {
                    dispatch(thunks.collapseCommandBar());
                    return;
                }
            }

            const formattedHelmValues =
                protectedSelectors.formattedHelmValues(getState());

            assert(formattedHelmValues !== undefined);

            dispatch(
                actions.helmGetValueShown({
                    cmdResp: formattedHelmValues
                })
            );
        },
    collapseCommandBar:
        () =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.commandBarCollapsed());
        }
} satisfies Thunks;

const privateThunks = {
    update:
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

            const { namespace: kubernetesNamespace } =
                projectManagement.protectedSelectors.currentProject(getState());

            dispatch(
                actions.updateCompleted({
                    helmReleaseFriendlyName:
                        helmRelease.friendlyName ?? helmRelease.helmReleaseName,
                    podNames: helmRelease.podNames,
                    helmValues: helmRelease.values,
                    monitoringUrl: (() => {
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
