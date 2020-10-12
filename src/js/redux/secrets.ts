import { createAsyncThunk } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import { axiosAuth } from "js/utils/axios-config";
import { env } from "js/env";
import createVaultApi from "js/vault-client";
import { assert } from "evt/tools/typeSafety/assert";
import memoize from "memoizee";
const VAULT = createVaultApi();
const VAULT_BASE_URI = env.VAULT.VAULT_BASE_URI as string;


/** We avoid importing app right away to prevent require cycles */
export const getAppActions = memoize(
	async () => {

		const { actions: appActions } = await import("./app");

		return { appActions };

	},
	{ "async": true }
);




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

					assert( typeof path === "string");

					const { appActions } = await getAppActions();

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

					assert( typeof path === "string");

					const { appActions } = await getAppActions();

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

					assert( typeof location === "string" && typeof data === "object");

					const { appActions } = await getAppActions();

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

				assert(typeof isSealed === "boolean");

				state.sealedStatus = isSealed ?
					"VAULT_STATUS_SEALED" :
					"VAULT_STATUS_UNSEALED";

			}
		);

		builder.addCase(
			asyncThunks.getVaultSecretsList.fulfilled,
			(state, { payload }) => {

				const { secrets } = payload;

				assert(false);

				state.vaultSecretsList = secrets;

			}
		);

		builder.addCase(
			asyncThunks.getVaultSecret.fulfilled,
			(state, { payload }) => {

				const { secrets } = payload;

				assert(false);

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

export const reducer = slice.reducer;






