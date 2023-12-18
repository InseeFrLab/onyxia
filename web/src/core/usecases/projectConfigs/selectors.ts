import type { State as RootState } from "core/bootstrap";
import * as projectSelection from "core/usecases/projectSelection";
import { join as pathJoin } from "path";

const dirPath = (rootState: RootState): string => {
    const { vaultTopDir } = projectSelection.selectors.currentProject(rootState);

    return pathJoin("/", vaultTopDir, ".onyxia");
};

const selectedProjectConfigs = (rootState: RootState) => rootState.projectConfigs;

export const privateSelectors = { dirPath };
export const selectors = { selectedProjectConfigs };
