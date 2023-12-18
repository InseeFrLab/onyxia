import { assert } from "tsafe/assert";
import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import type { Project } from "core/ports/OnyxiaApi";

const currentProject = (rootState: RootState): Project => {
    const state = rootState[name];
    const { projects, selectedProjectId } = state;

    const selectedProject = projects.find(({ id }) => id === selectedProjectId);

    assert(selectedProject !== undefined);

    return selectedProject;
};

export const selectors = { currentProject };
