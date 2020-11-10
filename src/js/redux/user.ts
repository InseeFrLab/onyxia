import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import { typeGuard } from "evt/tools/typeSafety/typeGuard";
import { assert } from "evt/tools/typeSafety/assert";
import { getEnv } from 'js/env';
import { restApiPaths } from "js/restApiPaths";
import { axiosAuth } from "js/utils/axios-config";
import { PUSHER } from "js/components/notifications";
import type { AxiosResponse } from "axios";
import { vaultApi } from "js/vault";
import memoize from "memoizee";

const env = getEnv();

/** We avoid importing app right away to prevent require cycles */
const getApp = memoize(
	() => import("./app"),
	{ "promise": true }
);

/*
type UnpackAxiosResponse<T> = T extends AxiosResponse<infer U> ? U : never;
assert(typeGuard<UnpackAxiosResponse<typeof user>>(user));
*/

export type S3 = {
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_SESSION_TOKEN: string;
    AWS_DEFAULT_REGION: 'us-east-1';
    AWS_S3_ENDPOINT: string;
    AWS_EXPIRATION: string;
};

//TODO: All caps here result in unnecessary work in the reducers.
//Make things more consistent across the codebase.
export type State = {
    USERNAME: string;
    IDEP: string | undefined;
    USERMAIL: string;
    USERKEY: 'https://example.com/placeholder.gpg';
    STATUS: string;
    UUID: string;
    IP: string;
    S3: S3 | undefined;
    SSH: {
        SSH_PUBLIC_KEY: string;
        SSH_KEY_PASSWORD: string;
    };
    KEYCLOAK: {
        KC_ID_TOKEN: string | undefined;
        KC_REFRESH_TOKEN: string | undefined;
        KC_ACCESS_TOKEN: string | undefined;
    } | undefined;
    /*
    VAULT: {
        VAULT_ADDR: string;
        VAULT_TOKEN: string | undefined;
        VAULT_MOUNT: string,
        VAULT_TOP_DIR: string | undefined,
        DATA: Record<string, string>;
    };
    */
};

export const name = "user";



const asyncThunks = {
    ...(() => {

        const typePrefix = "getUserInfo";

        return {
            //NOTE: Over engineered, more of a proof of concept than something really useful.
            //Take as a reference for later on how to type Thunk lifecycle.
            // https://redux-toolkit.js.org/usage/usage-with-typescript#createasyncthunk
            [typePrefix]: createAsyncThunk<
                Parameters<typeof syncActions.setUserInfo>[0],
                undefined,
                { rejectValue: { axiosErrorMessage: string; }; }
            >(
                `${name}/${typePrefix}`,
                (...[, { rejectWithValue }]) => axiosAuth.get(restApiPaths.userInfo)
                    .then(user => user as any)
                    .catch((error: Error) => rejectWithValue({ "axiosErrorMessage": error.message }))
            )
        };


    })(),
    ...(() => {

        const typePrefix = "updateUser";

        return {
            [typePrefix]: createAsyncThunk(
                `${name}/${typePrefix}`,
                async (...[, { dispatch }]) => {

                    const { actions: appActions } = await getApp();

                    dispatch(appActions.startWaiting());

                    const user = await axiosAuth
                        .get(restApiPaths.updateUser);

                    dispatch(appActions.stopWaiting());

                    return user as unknown as Parameters<typeof syncActions.setUserInfo>[0];

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

					assert( 
						typeof location === "string" && 
						typeof data === "object"
					);

                    const { actions: appActions } = await getApp();

					dispatch(appActions.startWaiting());

					await vaultApi.uploadSecret({ "path": location, data });

					dispatch(appActions.stopWaiting());

					return { data };

				}
			)
		};

	})()

};


const reusableReducers = {
    /*
    {
      type: 'onyxia/app/setUserInfo',
      payload: {
        user: {
          email: 'joseph.garrone.gj@gmail.com',
          idep: 'jgarrone',
          nomComplet: 'Joseph Garrone',
          ip: '81.64.22.177'
        }
      }
    }
    */
    "setUserInfo": (
        state: State,
        { payload }: {
            payload: {
                email: string;
                idep: string;
                nomComplet: string;
                ip: string;
                sshPublicKey?: string;
                password?: string;
            }
        }
    ) => {

        const { email, idep, nomComplet, ip, sshPublicKey, password } = payload;

        assert(
            typeof email === "string" &&
            typeof idep === "string" &&
            typeof nomComplet === "string" &&
            typeof ip === "string" &&
            (sshPublicKey === undefined || typeof sshPublicKey === "string") &&
            (password === undefined || typeof password === "string")
        );

        state.USERMAIL = email;
        state.IDEP = idep;
        state.USERNAME = nomComplet;
        state.IP = ip;

        const { SSH, VAULT } = state;


        if (sshPublicKey) {
            SSH.SSH_PUBLIC_KEY = sshPublicKey;
        }

        if (password) {
            SSH.SSH_KEY_PASSWORD = password;
        }

        VAULT.VAULT_TOP_DIR = idep;


    },
    /*
    {
      type: 'onyxia/mesSecrets/newVaultData',
      payload: {
        data: {
          password: 'yQgE0SG54rJGfwZ23k0V',
          git_user_name: 'Joseph Garrone',
          git_user_mail: 'joseph.garrone.gj@gmail.com',
          git_credentials_cache_duration: '0'
        }
      }
    }
    */
    "newVaultData": (
        state: State,
        { payload }: {
            payload: {
                data: Record<string, string | undefined>;
            }
        }
    ) => {

        const { data } = payload;

        assert(typeof data === "object");

        Object.keys(data)
            .forEach(key => {
                const v = data[key];

                if( v === undefined ){
                    return;
                }

                state.VAULT.DATA[key] = v;

            });

    },
};


const slice = createSlice({
    name,
    "initialState": id<State>({
        "USERNAME": "",
        "IDEP": undefined,
        "USERMAIL": "",
        "USERKEY": "https://example.com/placeholder.gpg",
        "STATUS": "",
        "UUID": "",
        "IP": "",
        "S3": undefined,
        "SSH": {
            "SSH_PUBLIC_KEY": '',
            "SSH_KEY_PASSWORD": '',
        },
        "KEYCLOAK": undefined,
        "VAULT": {
            "VAULT_ADDR": env.VAULT.VAULT_BASE_URI,
            "VAULT_TOKEN": undefined,
            "VAULT_MOUNT": env.VAULT.VAULT_KV_ENGINE,
            "VAULT_TOP_DIR": undefined,
            "DATA": {},
        },
    }),
    "reducers": {
        "setAuthenticated": ( //USED
            state,
            { payload }: PayloadAction<{
                idToken: string;
                refreshToken: string;
                accessToken: string
            }>
        ) => {

            const { idToken, refreshToken, accessToken } = payload;

            state.KEYCLOAK = {
                "KC_ID_TOKEN": idToken,
                "KC_REFRESH_TOKEN": refreshToken,
                "KC_ACCESS_TOKEN": accessToken
            };

        },
        /*
        {
        type: 'onyxia/S3/newCredentials',
        payload: {
            credentials: {
            accessKey: 'JOC...SEHE',
            secretAccessKey: 'c5Db1Y...HxNLX',
            sessionToken: 'ey...zobOPxHT_LRRjHw',
            expiration: '2020-09-16T01:50:26Z'
            }
        }
        }
        */
        "newS3Credentials": (
            state,
            { payload }: PayloadAction<{
                accessKey: string;
                secretAccessKey: string;
                expiration: string;
                sessionToken: string;
            }>
        ) => {

            const { accessKey, secretAccessKey, expiration, sessionToken } = payload;

            assert(
                typeof accessKey === "string" &&
                typeof secretAccessKey === "string" &&
                typeof expiration === "string" &&
                typeof sessionToken === "string"
            );

            state.S3 = {
                "AWS_ACCESS_KEY_ID": accessKey,
                "AWS_SECRET_ACCESS_KEY": secretAccessKey,
                "AWS_EXPIRATION": expiration,
                "AWS_SESSION_TOKEN": sessionToken,
                "AWS_DEFAULT_REGION": "us-east-1",
                "AWS_S3_ENDPOINT": env.MINIO.END_POINT
            };

        },
        /*
        {
          type: 'onyxia/mesSecrets/newVaultToken',
          payload: {
            token: 's.CFtVm4AJzsFCDzxZ1XuVMJeF'
          }
        }
        */
        "newVaultToken": (
            state,
            { payload }: PayloadAction<{
                token: string;
            }>
        ) => {

            const { token } = payload;

            assert(typeof token === "string");

            state.VAULT.VAULT_TOKEN = token;

        },
        ...reusableReducers
    },
    "extraReducers": builder => {

        builder.addCase(
            asyncThunks.getUserInfo.fulfilled,
            (state, { payload: user }) => {

                assert(typeof user === "object");

                //NOTE: There is a middleware in front of Axios responses.
                type UnpackAxiosResponse<T> = T extends AxiosResponse<infer U> ? U : never;
                assert(typeGuard<UnpackAxiosResponse<typeof user>>(user));

                reusableReducers.setUserInfo(state, { "payload": user })

            }

        );

        builder.addCase(
            asyncThunks.getUserInfo.rejected,
            (...[, action]) => {

                //NOTE: If payload is undefined, it means that 
                //the Thunk has rejected. In the present case it's impossible.
                assert(action.payload !== undefined);

                //TODO: This is just for test. We need to properly handle API errors.
                PUSHER.push(`API Error: ${action.payload.axiosErrorMessage}`)

            }
        );


        builder.addCase(
            asyncThunks.updateUser.fulfilled,
            (state, { payload: user }) => {

                assert(typeof user === "object");


                type UnpackAxiosResponse<T> = T extends AxiosResponse<infer U> ? U : never;
                assert(typeGuard<UnpackAxiosResponse<typeof user>>(user));

                reusableReducers.setUserInfo(state, { "payload": user })

                //TODO: Franglish
                PUSHER.push("mise à jour réussie.");

            }
        );

        builder.addCase(
            asyncThunks.updateUser.rejected,
            (...[, { error }]) => {

                //NOTE: If we are here we know that the Thunk has rejected.

                //TODO: Franglish
                PUSHER.push(`User update has failed ${error.message}`);

            }

        );


        builder.addCase(
            asyncThunks.updateVaultSecret.fulfilled,
            (state, { payload }) => reusableReducers.newVaultData(state, { payload })
        );

    }

});

const { actions: syncActions } = slice;

export const actions = {
    ...syncActions,
    ...asyncThunks
};

export const reducer = slice.reducer;




