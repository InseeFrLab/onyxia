
import * as reactRedux from "react-redux";
import type { Store, RootState } from "lib/setup";


/** useDispatch from "react-redux" but with correct return type for asyncThunkActions */
export const useDispatch = () => reactRedux.useDispatch<Store["dispatch"]>();

export const useSelector: reactRedux.TypedUseSelectorHook<RootState> = reactRedux.useSelector;