import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";

export type State = {
    logsByPodNameByHelmReleaseNameByProjectId: Record<
        string,
        Record<string, Record<string, string>>
    >;
    isFetching: boolean;
    currentPod:
        | {
              projectId: string;
              helmReleaseName: string;
              podName: string;
          }
        | undefined;
};

export const name = "podLogs";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State>({
            logsByPodNameByHelmReleaseNameByProjectId: {},
            isFetching: false,
            currentPod: undefined
        })
    ),
    reducers: {
        updateStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    projectId: string;
                    helmReleaseName: string;
                    podName: string;
                };
            }
        ) => {
            const { projectId, helmReleaseName, podName } = payload;

            state.currentPod = { projectId, helmReleaseName, podName };
            state.isFetching = true;
        },
        updateCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    projectId: string;
                    helmReleaseName: string;
                    podName: string;
                    logs: string;
                };
            }
        ) => {
            const { projectId, helmReleaseName, podName, logs } = payload;

            ((state.logsByPodNameByHelmReleaseNameByProjectId[projectId] ??= {})[
                helmReleaseName
            ] ??= {})[podName] = logs;

            state.isFetching = false;
        }
    }
});
