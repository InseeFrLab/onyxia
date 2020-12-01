import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import { assert } from "evt/tools/typeSafety/assert";
import type { AppThunk } from "lib/setup";


export type State = {
	redirectUri: string | null;
	waiting: boolean;
	displayLogin: boolean;
	visite: boolean;
	faviconUrl: string;
};

export const name = "app";

export const thunk = {
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
		"redirectUri": null,
		"waiting": false,
		"displayLogin": false,
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
		}
	}
});


export const { reducer } = slice;



export const actions = id<Omit<typeof slice.actions, "applicationResize">>(slice.actions);




