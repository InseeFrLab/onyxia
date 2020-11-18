import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import { assert } from "evt/tools/typeSafety/assert";
import type { AppThunk } from "lib/setup";

export type State = {
	authenticated: boolean;
	redirectUri: string | null;
	waiting: boolean;
	displayLogin: boolean;
	screenWidth: number;
	visite: boolean;
	faviconUrl: string;
};

export const name = "app";

const asyncThunks = {
	"logout":
		(): AppThunk<Promise<never>> => async (...args) => {

			const [, , { keycloakClient }] = args;

			assert(keycloakClient.isUserLoggedIn);

			return keycloakClient.logout();

		}
};


const slice = createSlice({
	name,
	"initialState": id<State>({
		"authenticated": false,
		"redirectUri": null,
		"waiting": false,
		"displayLogin": false,
		"screenWidth": 0,
		"visite": false,
		"faviconUrl": "/onyxia.png"
	}),
	"reducers": {
		/*
		{
				type: 'onyxia/app/startWaiting'
		}
		*/
		"startWaiting": state => {
			state.waiting = true;
		},
		/*
		{
			type: 'onyxia/app/stopWaiting'
		}
		*/
		"stopWaiting": state => { //USED
			state.waiting = false;
		},
		"setRedirectUri": (
			state,
			{ payload }: PayloadAction<{ uri: State["redirectUri"]; }>
		) => {

			const { uri } = payload;

			assert(typeof uri === "string");

			state.redirectUri = uri;

		},
		"displayLogin": (
			state,
			{ payload }: PayloadAction<{ doDisplay: State["displayLogin"]; }>
		) => {

			const { doDisplay } = payload;

			assert(typeof doDisplay === "boolean");

			state.displayLogin = doDisplay;

		},
		"applicationResize": (
			state,
			{ payload }: PayloadAction<{ width: State["screenWidth"]; }>
		) => {

			const { width } = payload;

			assert(typeof width === "number");

			state.screenWidth = width;

		},
		"setFavicon": (
			state,
			{ payload }: PayloadAction<{ url: State["faviconUrl"]; }>
		) => {

			const { url } = payload;

			assert(typeof url === "string");

			state.faviconUrl = url;

		},
		"startVisite": (state) => {
			state.visite = true;
		},
		"setIsAuthenticated": (
			state,
			{ payload }: PayloadAction<{ isUserLoggedIn: boolean; }>
		) => {
			const { isUserLoggedIn } = payload;

			state.authenticated = isUserLoggedIn;

		}
	}
});

const { actions: syncActions } = slice;



export const actions = {
	...syncActions,
	...asyncThunks
};

export const reducer = slice.reducer;



