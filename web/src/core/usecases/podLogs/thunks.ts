import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { same } from "evt/tools/inDepth/same";
import * as projectManagement from "core/usecases/projectManagement";

export const thunks = {
    setActive:
        (params: { helmReleaseName: string; podName: string }) =>
        (...args) => {
            const { helmReleaseName, podName } = params;

            const [dispatch] = args;

            let isActive = true;

            (async function periodicalRefresh() {
                if (!isActive) {
                    return;
                }

                try {
                    await dispatch(privateThunks.update({ helmReleaseName, podName }));
                } catch {
                    console.log("Pulling events and logs failed");
                }

                setTimeout(periodicalRefresh, 2_000);
            })();

            function setInactive() {
                isActive = false;
            }

            return { setInactive };
        }
} satisfies Thunks;

const privateThunks = {
    update:
        (params: { helmReleaseName: string; podName: string }) =>
        async (...args) => {
            const { helmReleaseName, podName } = params;

            const [dispatch, getState, { onyxiaApi }] = args;

            const projectId =
                projectManagement.protectedSelectors.currentProject(getState()).id;

            {
                const state = getState()[name];

                if (
                    state.isFetching &&
                    same(state.currentPod, { projectId, helmReleaseName, podName })
                ) {
                    return;
                }
            }

            dispatch(actions.updateStarted({ projectId, helmReleaseName, podName }));

            const logs = await onyxiaApi.kubectlLogs({
                helmReleaseName,
                podName
            });

            dispatch(
                actions.updateCompleted({
                    projectId,
                    helmReleaseName,
                    podName,
                    logs
                })
            );
        }
} satisfies Thunks;
