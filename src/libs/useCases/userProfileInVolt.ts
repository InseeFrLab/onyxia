
import { generatePlaceholderInitialState } from "../utils/generatePlaceholderInitialState";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk } from "../setup";
import { join as pathJoin } from "path";
import { id, Id } from "evt/tools/typeSafety/id";
import { objectKeys } from "evt/tools/typeSafety/objectKeys";

export type UserProfileInVolt = Id<Record<string, string | number | null>, {
    username: string;
    email: string;
    userServicePassword: string;
    kaggleApiToken: string | null;
    gitName: string;
    gitEmail: string;
    gitCredentialCacheDuration: number;
}>;

export type ImmutableKeys = Id<keyof UserProfileInVolt, "username">;
export type MutableKeys = Exclude<keyof UserProfileInVolt, ImmutableKeys>;

export type UserProfileInVoltState = {
    [K in keyof UserProfileInVolt]: {
        value: UserProfileInVolt[K];
        isBeingChanged: K extends ImmutableKeys ? false : boolean;
    };
};

export type ChangeValueParams<K extends MutableKeys = MutableKeys> = {
    key: K;
    value: UserProfileInVolt[K];
};

export const sliceName = "userProfileInVolt";

const { reducer, actions } = createSlice({
    "name": sliceName,
    "initialState": generatePlaceholderInitialState<UserProfileInVoltState>(
        "The user profile should have been initialized during the store initialization"
    ),
    "reducers": {
        "initializationCompleted": (...[, { payload }]: [any, PayloadAction<{ userProfile: UserProfileInVolt; }>]) => {

            const { userProfile } = payload;

            return Object.fromEntries(
                Object.entries(userProfile)
                    .map(([key, value]) => [key, { "secret": value, "isBeingChanged": false }])
            ) as any;

        },
        "changeStarted": (state, { payload }: PayloadAction<ChangeValueParams>) => {

            const wrap = state[payload.key];

            wrap.value = payload.value;
            wrap.isBeingChanged = true;

        },
        "changeCompleted": (state, { payload }: PayloadAction<{ key: MutableKeys; }>) => {
            state[payload.key].isBeingChanged = false;
        }


    }

});

export { reducer };

export const getProfileKeyPathFactory = (params: { username: string; }) => {

    const { username } = params;

    const getProfileKeyPath = (params: { key: keyof UserProfileInVolt; }) => {

        const { key } = params;

        return pathJoin(username, ".onyxia", "profile", key);

    };

    return { getProfileKeyPath };

}

const generatePassword = () => Math.random().toString(36).slice(-20);

export const privateThunks = {
    "initializeProfile":
        (params: { username: string; email: string; }): AppThunk => async (...args) => {

            const { username, email } = params;

            const [dispatch, , { vaultClient }] = args;

            const { getProfileKeyPath } = getProfileKeyPathFactory({ username });


            await vaultClient.put({
                "path": getProfileKeyPath({ "key": id<keyof UserProfileInVolt>("username") }),
                "secret": { "value": username }
            });

            const userProfile: UserProfileInVolt = {
                username,
                email,
                "userServicePassword": generatePassword(),
                "kaggleApiToken": null,
                "gitName": username,
                "gitEmail": email,
                "gitCredentialCacheDuration": 0
            };


            for (const key of objectKeys(userProfile)) {

                const path = getProfileKeyPath({ key: key });

                const secretWithMetadata = await vaultClient.get({
                    path
                }).catch(() => undefined);


                if (
                    !secretWithMetadata ||
                    !("value" in secretWithMetadata.secret)
                ) {

                    await vaultClient.put({
                        path,
                        "secret": { "value": userProfile[key] }
                    });

                    continue;

                }

                Object.assign(userProfile, { [key]: secretWithMetadata.secret["value"] });

            }

            dispatch(actions.initializationCompleted({ userProfile }));

        },
};

export const thunks = {
    "changeValue":
        (params: ChangeValueParams): AppThunk => async (...args) => {

            const [dispatch, getState, { vaultClient }] = args;

            dispatch(actions.changeStarted(params));

            const { getProfileKeyPath } = getProfileKeyPathFactory({
                "username": getState().userProfileInVolt.username.value
            });

            await vaultClient.put({
                "path": getProfileKeyPath({ "key": params.key }),
                "secret": { "value": params.value }
            });

            dispatch(actions.changeCompleted(params));

        },
    "renewUserServicePassword":
        (): AppThunk => dispatch => 
            dispatch(
                thunks.changeValue({
                    "key": "userServicePassword",
                    "value": generatePassword()
                })
            )
};



