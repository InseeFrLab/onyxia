import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import { getKeycloakInstance } from "js/utils/getKeycloakInstance";
import * as localStorageToken from "js/utils/localStorageToken";
//import { actions as userActions } from "./user";

console.log("import app");

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
	//TODO: As is, this has really no business being an redux action.
	...(() => {

		const typePrefix = "logout";

		return {
			[typePrefix]: createAsyncThunk(
				`${name}/${typePrefix}`,
				async () => {

					localStorageToken.clear();

					await getKeycloakInstance()
						.logout({ "redirectUri": `${window.location.origin}/accueil` });


				}
			)
		};


	})()
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
		"faviconUrl": "/onyxia.png",
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

			state.redirectUri = uri;

		},
		"displayLogin": (
			state,
			{ payload }: PayloadAction<{ doDisplay: State["displayLogin"]; }>
		) => {

			const { doDisplay } = payload;

			state.displayLogin = doDisplay;

		},
		/*
		{
		  type: 'onyxia/app/appResize',
		  payload: {
		    width: 2560
		  }
		}
		*/
		"applicationResize": (
			state,
			{ payload }: PayloadAction<{ width: State["screenWidth"]; }>
		) => {

			const { width } = payload;

			state.screenWidth = width;

		},
		"setFavicon": (
			state,
			{ payload }: PayloadAction<{ url: State["faviconUrl"]; }>
		) => {

			const { url } = payload;

			state.faviconUrl = url;

		},
		/*
		{
  			type: 'onyxia/app/startVisite'
		}
		*/
		"startVisite": (
			state
		) => {

			state.visite = true;

		}
	},
	/*
	"extraReducers": {
		[userActions.setAuthenticated.type]: state => {
			state.authenticated = true;
		}
	}
	*/
	"extraReducers": {
		"user/setAuthenticated": state => {
			state.authenticated = true;
		}
	}

	/*
	"extraReducers": builder => {

		//Hack to avoid problems with require cycles
		(async () => { await Promise.resolve();

			console.log("===", userActions.setAuthenticated.type);

			builder.addCase(
				userActions.setAuthenticated.type,
				state => { state.authenticated = true; }
			);

		})();

	}
	*/
});

const { actions: syncActions } = slice;

export const actions = {
	...syncActions,
	...asyncThunks
};

export const select = (state: RootState) => state.myFiles;

export const reducer = slice.reducer;



