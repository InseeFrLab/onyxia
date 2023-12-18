import type { Project } from "core/ports/OnyxiaApi";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";

export type State = {
    projects: Project[];
    selectedProjectId: string;
};

export const name = "projectSelection";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>(),
    "reducers": {
        "initialized": (_, { payload }: { payload: State }) => payload,
        "projectChanged": (
            state,
            { payload }: { payload: { selectedProjectId: string } }
        ) => {
            const { selectedProjectId } = payload;

            state.selectedProjectId = selectedProjectId;
        }
    }
});
