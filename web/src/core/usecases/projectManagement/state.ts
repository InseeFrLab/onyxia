import type { Project } from "core/ports/OnyxiaApi";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import type { ProjectConfigs } from "./decoupledLogic/ProjectConfigs";

type State = {
    projects: Project[];
    selectedProjectId: string;
    currentProjectConfigs: ProjectConfigs;
};

export const name = "projectManagement";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        projectChanged: (_state, { payload }: { payload: State }) => payload,
        configValueUpdated: (
            state,
            { payload }: { payload: ChangeConfigValueParams }
        ) => {
            const { key, value } = payload;

            Object.assign(state.currentProjectConfigs, { [key]: value });
        }
    }
});

export type ChangeConfigValueParams<
    K extends keyof ProjectConfigs = keyof ProjectConfigs
> = {
    key: K;
    value: ProjectConfigs[K];
};
