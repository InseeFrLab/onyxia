import {
    usecasesToSelectors,
    usecasesToAutoDispatchThunks,
    usecasesToPureFunctions,
} from "clean-redux";
import { createStore, usecases } from "./setup";
export type { Dispatch, RootState } from "./setup";

export { createStore };
export const selectors = usecasesToSelectors(usecases);
export const { getAutoDispatchThunks } = usecasesToAutoDispatchThunks(usecases);
export const pure = usecasesToPureFunctions(usecases);
