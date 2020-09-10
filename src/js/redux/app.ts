import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import { getKeycloakInstance } from "js/utils/getKeycloakInstance";
import * as localStorageToken from "js/utils/localStorageToken";

export type State = {
	authenticated: boolean;
	redirectUri: string | null;
	waiting: boolean;
	displayLogin: boolean;
	screenWidth: number;
	visite: boolean;
	faviconUrl: string;
};

export const name= "app";

const slice = createSlice({
	name,
	"initialState": id<State>({
		"authenticated": false,
		"redirectUri": null,
		"waiting": false,
		"displayLogin": false,
		"screenWidth": 0,
		"visite": false,
		"faviconUrl": "/onyxia.png",
	}),
	"reducers": {
		"setAuthenticated": state => {
			state.authenticated = true;
		},
		"startWaiting": state => {
			state.waiting = true;
		},
		"stopWaiting": state => {
			state.waiting = false;
		},
		"setRedirectUri": (
			state,
			{ payload }: PayloadAction<{ uri: State["redirectUri"]; }>
		) => {

			const { uri } = payload;

			state.redirectUri = uri;

		},
		"displayLogin": (
			state,
			{ payload }: PayloadAction<{ doDisplay: State["displayLogin"]; }>
		) => {

			const { doDisplay } = payload;

			state.displayLogin = doDisplay;

		},
		"applicationResize": (
			state,
			{ payload }: PayloadAction<{ width: State["screenWidth"]; }>
		) => {

			const { width } = payload;

			state.screenWidth = width;

		},
		"setFavicon": (
			state,
			{ payload }: PayloadAction<{ url: State["faviconUrl"]; }>
		)=> {

			const { url } = payload;

			state.faviconUrl = url;
			
		},
		"startVisite": (
			state
		) => {

			state.visite = true;

		}
	}
});

const { actions: syncActions } = slice;


const asyncActions = {
	//TODO: As is, this has really no business being an redux action.
	"logout": () => async () => {

		localStorageToken.clear();

		await getKeycloakInstance()
			.logout({ "redirectUri": `${window.location.origin}/accueil` });

	}
};

export const actions = {
	...syncActions,
	...asyncActions
};

export const select = (state: RootState) => state.myFiles;

export const reducer = slice.reducer;



