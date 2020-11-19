import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import { assert } from "evt/tools/typeSafety/assert";
import { restApiPaths } from "js/restApiPaths";
import { axiosAuth } from "js/utils/axios-config";
import { getEnv } from "js/env";
import type { AppThunk } from "lib/setup";
import { parseOidcAccessToken } from "lib/ports/KeycloakClient";
import { Evt } from "evt";
import type { KeycloakClient } from "lib/ports/KeycloakClient";

export type S3 = {
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_SESSION_TOKEN: string;
    AWS_DEFAULT_REGION: "us-east-1";
    AWS_S3_ENDPOINT: string;
    AWS_EXPIRATION: string;
};

export type UserState = {
    ip: string;
    s3: S3 | undefined;
};

export type UserProfile = {
    idep: string;
    email: string;
    nomComplet: string;
};


const userProfileByVaultClient = new WeakMap<KeycloakClient.LoggedIn, UserProfile>();


export const name = "user";


export const thunk = {
    "getUserProfile":
        (): AppThunk<UserProfile> => (...args) => {

            const [, , { keycloakClient }] = args;

            assert(keycloakClient.isUserLoggedIn);

            return userProfileByVaultClient.get(keycloakClient)!;

        }
};

export const privateThunks = {
    "initialize":
        (): AppThunk => async (...args) => {

            const [dispatch, , { keycloakClient }] = args;

            assert(keycloakClient.isUserLoggedIn);

            const getNomCompletAndSetIp = async ()=> {

                const { ip, nomComplet }: any = await axiosAuth.get(restApiPaths.userInfo);

                dispatch(slice.actions.setIp(ip));

                return { nomComplet };

            };

            Evt.from(window, "online").attach(getNomCompletAndSetIp);

            const { nomComplet } = await getNomCompletAndSetIp();

            const { email, idep } = await parseOidcAccessToken(keycloakClient);

            userProfileByVaultClient.set(keycloakClient, { email, idep, nomComplet });

        }
};

const slice = createSlice({
    name,
    "initialState": id<UserState>({
        "s3": undefined,
        "ip": ""
    }),
    "reducers": {
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

            state.s3 = {
                "AWS_ACCESS_KEY_ID": accessKey,
                "AWS_SECRET_ACCESS_KEY": secretAccessKey,
                "AWS_EXPIRATION": expiration,
                "AWS_SESSION_TOKEN": sessionToken,
                "AWS_DEFAULT_REGION": "us-east-1",
                "AWS_S3_ENDPOINT": getEnv().MINIO.END_POINT
            };

        },
        "setIp": (
            state,
            { payload }: PayloadAction<string>
        ) => {
            state.ip = payload;
        }
    }
});

export const { reducer } = slice;

export const actions = id<Omit<typeof slice.actions, "setUserInfo">>(slice.actions);








