import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { ThunkAction } from "core/setup";

export type State = {
    redirectUri: string | null;
    waiting: boolean;
    displayLogin: boolean;
    visite: boolean;
    faviconUrl: string;
};

export const name = "app";

export const thunks = {
    "logout":
        (): ThunkAction<Promise<never>> =>
        async (...args) => {
            const [, , { oidcClient }] = args;

            assert(oidcClient.isUserLoggedIn);

            return oidcClient.logout({ "redirectTo": "home" });
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
				type: 'onyxia/ui/startWaiting'
		}
		*/
        "startWaiting": state => {
            state.waiting = true;
        },
        /*
		{
			type: 'onyxia/ui/stopWaiting'
		}
		*/
        "stopWaiting": state => {
            //USED
            state.waiting = false;
        },
        "setRedirectUri": (
            state,
            { payload }: PayloadAction<{ uri: State["redirectUri"] }>
        ) => {
            const { uri } = payload;

            assert(typeof uri === "string");

            state.redirectUri = uri;
        },
        "displayLogin": (
            state,
            { payload }: PayloadAction<{ doDisplay: State["displayLogin"] }>
        ) => {
            const { doDisplay } = payload;

            assert(typeof doDisplay === "boolean");

            state.displayLogin = doDisplay;
        },
        "setFavicon": (
            state,
            { payload }: PayloadAction<{ url: State["faviconUrl"] }>
        ) => {
            const { url } = payload;

            assert(typeof url === "string");

            state.faviconUrl = url;
        },
        "startVisite": state => {
            state.visite = true;
        }
    }
});

export const { reducer } = slice;

export const actions = id<Omit<typeof slice.actions, "applicationResize">>(slice.actions);
