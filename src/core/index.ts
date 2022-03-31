import {
    usecasesToSelectors,
    usecasesToAutoDispatchThunks,
    usecasesToPureFunctions,
} from "redux-clean-architecture";
import { createStore, usecases } from "./setup";
export type { Dispatch, RootState } from "./setup";

export { createStore };
export const selectors = usecasesToSelectors(usecases);
export const { getAutoDispatchThunks } = usecasesToAutoDispatchThunks(usecases);
export const pure = usecasesToPureFunctions(usecases);
export { languages } from "./ports/OnyxiaApiClient";
export type { Language } from "./ports/OnyxiaApiClient";
