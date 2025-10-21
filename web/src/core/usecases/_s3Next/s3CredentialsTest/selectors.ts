import type { State as RootState } from "core/bootstrap";
import { name } from "./state";

export const protectedSelectors = {
    credentialsTestState: (rootState: RootState) => rootState[name]
};
