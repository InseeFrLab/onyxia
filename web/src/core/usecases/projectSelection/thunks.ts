import type { Thunks } from "core/bootstrap";
import * as userConfigs from "core/usecases/userConfigs";
import { actions } from "./state";

export const thunks = {
    "changeProject":
        (params: {
            projectId: string;
            /** Default false, only use if we reload just after */
            doPreventDispatch?: boolean;
        }) =>
        async (...args) => {
            const [dispatch] = args;

            const { projectId, doPreventDispatch = false } = params;

            await dispatch(
                userConfigs.thunks.changeValue({
                    "key": "selectedProjectId",
                    "value": projectId
                })
            );

            if (doPreventDispatch) {
                return;
            }

            dispatch(
                actions.projectChanged({
                    "selectedProjectId": projectId
                })
            );
        }
} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi }] = args;

            const projects = await onyxiaApi.getUserProjects();

            let { selectedProjectId } = userConfigs.selectors.main(getState());

            if (
                selectedProjectId === null ||
                !projects.map(({ id }) => id).includes(selectedProjectId)
            ) {
                selectedProjectId = projects[0].id;

                await dispatch(
                    userConfigs.thunks.changeValue({
                        "key": "selectedProjectId",
                        "value": selectedProjectId
                    })
                );
            }

            dispatch(
                actions.initialized({
                    projects,
                    selectedProjectId
                })
            );
        }
} satisfies Thunks;
