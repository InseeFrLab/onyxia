
import * as myFiles from "./myFiles";
import * as myLab from "./myLab";
import * as regions from "./regions";
import * as user from "./user";
import * as app from "./app";

export const actions = {
	...myFiles.actions,
	...myLab.actions,
	...app.actions,
	...user.actions,
	...regions.actions,
};


/*
//Use this instead of the custom type
import type { HandleThunkActionCreator } from "react-redux";

export type ToConnected<T extends AsyncThunk<any, any, any> | ActionCreatorWithoutPayload<any>> = T extends AsyncThunk<infer R, infer P, any> ?
	(param: P) => Promise<R> :
	T extends ActionCreatorWithoutPayload<any> ? () => void :
	never;
*/


