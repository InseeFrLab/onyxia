
import { configureStore } from "@reduxjs/toolkit";
import * as myFiles from "./myFiles";
import * as myLab from "./myLab";
import * as regions from "./regions";
import * as reactRedux from "react-redux";
import * as user from "./user";
import * as app from "./app";

export const store = configureStore({
  "reducer": {
	[myFiles.name]: myFiles.reducer,
	[myLab.name]: myLab.reducer,
	[app.name]: app.reducer,
	[user.name]: user.reducer,
	[regions.name]: regions.reducer
  }
});

export const actions = {
	...myFiles.actions,
	...myLab.actions,
	...app.actions,
	...user.actions,
	...regions.actions
};

/** useDispatch from "react-redux" but with correct return type for asyncThunkActions */
export const useDispatch = ()=> reactRedux.useDispatch<typeof store.dispatch>();

export type RootState = ReturnType<typeof store.getState>;

export const useSelector: reactRedux.TypedUseSelectorHook<RootState> =
  reactRedux.useSelector;

/*

//Use this instead of the custom type
import type { HandleThunkActionCreator } from "react-redux";

export type ToConnected<T extends AsyncThunk<any, any, any> | ActionCreatorWithoutPayload<any>> = T extends AsyncThunk<infer R, infer P, any> ?
	(param: P) => Promise<R> :
	T extends ActionCreatorWithoutPayload<any> ? () => void :
	never;
*/


