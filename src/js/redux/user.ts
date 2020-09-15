import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import conf from '../configuration';
import { id } from "evt/tools/typeSafety/id";
import type { PayloadAction } from "@reduxjs/toolkit";
import { resApiPaths } from "js/restApiPaths";
import { axiosAuth } from "js/utils/axios-config";
import type { AxiosResponse } from "axios";
import { assert } from "evt/tools/typeSafety/assert";
import { typeGuard } from "evt/tools/typeSafety/typeGuard";
import { PUSHER } from "js/components/notifications";
import { actions as appActions } from "./app";
import type { RootState } from "./store";


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
    S3: {
        AWS_ACCESS_KEY_ID: string | undefined;
        AWS_SECRET_ACCESS_KEY: string | undefined,
        AWS_SESSION_TOKEN: string | undefined,
        AWS_DEFAULT_REGION: 'us-east-1',
        AWS_S3_ENDPOINT: string,
        AWS_EXPIRATION: undefined | string,
    },
    SSH: {
        SSH_PUBLIC_KEY: string;
        SSH_KEY_PASSWORD: string;
    },
    KEYCLOAK: {
        KC_ID_TOKEN: string | undefined;
        KC_REFRESH_TOKEN: string | undefined;
        KC_ACCESS_TOKEN: string | undefined;
    },
    KUBERNETES: {
        KUB_SERVER_NAME: string;
        KUB_SERVER_URL: string;
    },
    VAULT: {
        VAULT_ADDR: string;
        VAULT_TOKEN: string | undefined;
        DATA: Record<string, string>;
    }
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
                AxiosResponse<Parameters<typeof syncActions.setUserInfo>[0]>,
                undefined,
                { rejectValue: { axiosErrorMessage: string; }; }
            >(
                `${name}/${typePrefix}`,
                (...[, { rejectWithValue }]) => axiosAuth.get(resApiPaths.userInfo)
                    .then(user => user)
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

                    dispatch(appActions.startWaiting());

                    const user = await axiosAuth
                        .get(resApiPaths.updateUser);

                    dispatch(appActions.stopWaiting());

                    return user as AxiosResponse<Parameters<typeof syncActions.setUserInfo>[0]>

                }
            )
        };


    })(),

};


const reusableReducers = {
    "setUserInfo": (
        state: State,
        { payload }: {
            payload: {
                email: string;
                idep: string;
                nomComplet: string;
                ip: string;
                sshPublicKey: string;
                password: string;
            }
        }
    ) => {

        const { email, idep, nomComplet, ip, sshPublicKey, password } = payload;

        state.USERMAIL = email;
        state.IDEP = idep;
        state.USERNAME = nomComplet;
        state.IP = ip;

        const { SSH } = state;

        SSH.SSH_PUBLIC_KEY = sshPublicKey;
        SSH.SSH_KEY_PASSWORD = password;

    }
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
        "S3": {
            "AWS_ACCESS_KEY_ID": undefined,
            "AWS_SECRET_ACCESS_KEY": undefined,
            "AWS_SESSION_TOKEN": undefined,
            "AWS_DEFAULT_REGION": 'us-east-1',
            "AWS_S3_ENDPOINT": conf.MINIO.END_POINT,
            "AWS_EXPIRATION": undefined,
        },
        "SSH": {
            "SSH_PUBLIC_KEY": '',
            "SSH_KEY_PASSWORD": '',
        },
        "KEYCLOAK": {
            "KC_ID_TOKEN": undefined,
            "KC_REFRESH_TOKEN": undefined,
            "KC_ACCESS_TOKEN": undefined,
        },
        "KUBERNETES": {
            "KUB_SERVER_NAME": conf.KUBERNETES.KUB_SERVER_NAME,
            "KUB_SERVER_URL": conf.KUBERNETES.KUB_SERVER_URL,
        },
        "VAULT": {
            "VAULT_ADDR": conf.VAULT.VAULT_BASE_URI,
            "VAULT_TOKEN": undefined,
            "DATA": {},
        },
    }),
    "reducers": {
        //TODO: We should be able to assume there is no more prop on KEYCLOAK
        "setAuthenticated": (
            state,
            { payload }: PayloadAction<{
                idToken: string;
                refreshToken: string;
                accessToken: string
            }>
        ) => {

            const { idToken, refreshToken, accessToken } = payload;

            const { KEYCLOAK } = state;

            KEYCLOAK.KC_ID_TOKEN = idToken;
            KEYCLOAK.KC_REFRESH_TOKEN = refreshToken;
            KEYCLOAK.KC_ACCESS_TOKEN = accessToken;

        },
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

            const { S3 } = state;

            S3.AWS_ACCESS_KEY_ID = accessKey;
            S3.AWS_SECRET_ACCESS_KEY = secretAccessKey;
            S3.AWS_EXPIRATION = expiration;
            S3.AWS_SESSION_TOKEN = sessionToken;

        },
        "newVaultToken": (
            state,
            { payload }: PayloadAction<{
                token: string;
            }>
        ) => {

            const { token } = payload;

            state.VAULT.VAULT_TOKEN = token;

        },
        "newVaultData": (
            state,
            { payload }: PayloadAction<{
                data: Record<string, string>;
            }>
        ) => {

            const { data } = payload;

            Object.keys(data)
                .forEach(key => state.VAULT.DATA[key] = data[key]);

        },
        ...reusableReducers
    },
    "extraReducers": builder => {

        builder.addCase(
            asyncThunks.getUserInfo.fulfilled,
            (state, { payload: user }) => {

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

    }

});

const { actions: syncActions } = slice;

export const actions = {
    ...syncActions,
    ...asyncThunks
};

export const select = (state: RootState) => state.user;

export const reducer = slice.reducer;




