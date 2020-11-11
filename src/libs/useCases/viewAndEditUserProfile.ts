
import { generatePlaceholderInitialState } from "../utils/generatePlaceholderInitialState";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk } from "../setup";
import { join as pathJoin } from "path";
import { id, Id } from "evt/tools/typeSafety/id";
import { objectKeys } from "evt/tools/typeSafety/objectKeys";

export type UserProfile = Id<Record<string, string | number | null>, {
    username: string;
    email: string;
    userServicePassword: string;
    kaggleApiToken: string | null;
    gitName: string;
    gitEmail: string;
    gitCredentialCacheDuration: number;
}>;

export type ImmutableKeys = Id<keyof UserProfile, "username">;
export type MutableKeys = Exclude<keyof UserProfile, ImmutableKeys>;

export type ViewAndEditUserProfileState = {
    [K in keyof UserProfile]: {
        value: UserProfile[K];
        isBeingChanged: K extends ImmutableKeys ? false : boolean;
    };
};

export type ChangeValueParams<K extends MutableKeys = MutableKeys> = {
    key: K;
    value: UserProfile[K];
};

export const sliceName = "viewAndEditUserProfile";

const { reducer, actions } = createSlice({
    "name": sliceName,
    "initialState": generatePlaceholderInitialState<ViewAndEditUserProfileState>(
        "The user profile should have been initialized during the store initialization"
    ),
    "reducers": {
        "initializationCompleted": (...[, { payload }]: [any, PayloadAction<{ userProfile: UserProfile; }>]) => {

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

    const getProfileKeyPath = (params: { key: keyof UserProfile; }) => {

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
                "path": getProfileKeyPath({ "key": id<keyof UserProfile>("username") }),
                "secret": { "value": username }
            });

            const userProfile: UserProfile = {
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
                "username": getState().viewAndEditUserProfile.username.value
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



