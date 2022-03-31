import { getAutoDispatchThunks, selectors, pure } from "core";
import type { Dispatch, RootState } from "core";
import { useDispatch, useSelector as reactRedux_useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
export { languages } from "core";
export type { Language } from "core";

export { selectors, pure };

export const useSelector: TypedUseSelectorHook<RootState> = reactRedux_useSelector;

export function useThunks() {
    const dispatch = useDispatch<Dispatch>();

    return getAutoDispatchThunks(dispatch);
}
