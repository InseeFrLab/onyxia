import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { getS3Url } from "core/adapters/officialOnyxiaApiClient";

export type S3 = {
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_SESSION_TOKEN: string;
    AWS_DEFAULT_REGION: string;
    AWS_S3_ENDPOINT: string;
    AWS_EXPIRATION: string;
};

export type UserState = {
    s3: S3 | undefined;
};

export const name = "user";

const slice = createSlice({
    name,
    "initialState": id<UserState>({
        "s3": undefined,
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
            {
                payload,
            }: PayloadAction<{
                accessKey: string;
                secretAccessKey: string;
                expiration: string;
                sessionToken: string;
            }>,
        ) => {
            const { accessKey, secretAccessKey, expiration, sessionToken } = payload;

            assert(
                typeof accessKey === "string" &&
                    typeof secretAccessKey === "string" &&
                    typeof expiration === "string" &&
                    typeof sessionToken === "string",
            );

            state.s3 = {
                "AWS_ACCESS_KEY_ID": accessKey,
                "AWS_SECRET_ACCESS_KEY": secretAccessKey,
                "AWS_EXPIRATION": expiration,
                "AWS_SESSION_TOKEN": sessionToken,
                "AWS_DEFAULT_REGION": "us-east-1",
                "AWS_S3_ENDPOINT": getS3Url().split("//")[1].split(":")[0],
            };
        },
    },
});

export const thunks = {};

export const { reducer } = slice;

export const actions = id<Omit<typeof slice.actions, "setUserInfo">>(slice.actions);
