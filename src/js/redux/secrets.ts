import { createAsyncThunk } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import type { RootState } from "./store";
import { axiosAuth } from "js/utils/axios-config";
import { env } from "js/env";
import { actions as appActions } from "./app";
import createVaultApi from "js/vault-client";
const VAULT = createVaultApi();
const VAULT_BASE_URI = env.VAULT.VAULT_BASE_URI as string;

console.log("import secrets");

export type State = {
	sealedStatus:
	"VAULT_STATUS_SEALED" |
	"VAULT_STATUS_UNSEALED" |
	"VAULT_STATUS_UNKNOWN";
	vaultSecretsList: { __brand: "vaultSecretsList" }[] | undefined;
	vaultSecret: { __brand: "vaultSecret" } | undefined;
};

export const name = "secrets";

const asyncThunks = {
	...(() => {

		const typePrefix = "checkVaultStatus";

		return {
			[typePrefix]: createAsyncThunk(
				`${name}/${typePrefix}`,
				async () => axiosAuth.get(`${VAULT_BASE_URI}/v1/sys/seal-status`) as Promise<boolean>
			)
		};


	})(),
	...(() => {

		const typePrefix = "getVaultSecretsList";

		return {
			[typePrefix]: createAsyncThunk(
				`${name}/${typePrefix}`,
				async (payload: { path: string; }, { dispatch }) => {

					const { path } = payload;

					dispatch(appActions.startWaiting());

					const secrets = await VAULT.getSecretsList(path) as State["vaultSecretsList"];

					dispatch(appActions.stopWaiting());

					return { secrets };

				}
			)
		};

	})(),
	...(() => {

		const typePrefix = "getVaultSecret";

		return {
			[typePrefix]: createAsyncThunk(
				`${name}/${typePrefix}`,
				async (payload: { path: string; }, { dispatch }) => {

					const { path } = payload;

					dispatch(appActions.startWaiting());

					const secrets = await VAULT.getSecret(path) as State["vaultSecret"];

					dispatch(appActions.stopWaiting());

					return { secrets };

				}
			)
		};

	})(),
	...(() => {

		const typePrefix = "updateVaultSecret";

		return {
			[typePrefix]: createAsyncThunk(
				`${name}/${typePrefix}`,
				async (payload: { location: string; data: Record<string, string>; }, { dispatch }) => {

					const { location, data } = payload;

					dispatch(appActions.startWaiting());

					await VAULT.uploadSecret(location, data);

					dispatch(appActions.stopWaiting());

					return { data };

				}
			)
		};

	})()
};




const slice = createSlice({
	name,
	"initialState": id<State>({
		"sealedStatus": "VAULT_STATUS_UNKNOWN",
		"vaultSecretsList": undefined,
		"vaultSecret": undefined

	}),
	"reducers": {},
	"extraReducers": builder => {

		builder.addCase(
			asyncThunks.checkVaultStatus.fulfilled,
			(state, { payload: isSealed }) => {

				state.sealedStatus = isSealed ?
					"VAULT_STATUS_SEALED" :
					"VAULT_STATUS_UNSEALED";

			}
		);

		builder.addCase(
			asyncThunks.getVaultSecretsList.fulfilled,
			(state, { payload }) => {

				const { secrets } = payload;

				state.vaultSecretsList = secrets;

			}
		);

		builder.addCase(
			asyncThunks.getVaultSecret.fulfilled,
			(state, { payload }) => {

				const { secrets } = payload;

				state.vaultSecret = secrets;

			}
		);

	}
});

const { actions: syncActions } = slice;

export const actions = {
	...syncActions,
	...asyncThunks
};

export const select = (state: RootState) => state.myFiles;

export const reducer = slice.reducer;






