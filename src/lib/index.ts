import {
    usecasesToSelectors,
    usecasesToAutoDispatchThunks,
    usecasesToPureFunctions,
} from "clean-redux";
import { createStore, useCases } from "./setup";
export type { Dispatch, RootState } from "./setup";

export { createStore };
export const selectors = usecasesToSelectors(useCases);
export const { getAutoDispatchThunks } = usecasesToAutoDispatchThunks(useCases);
export const pure = usecasesToPureFunctions(useCases);
