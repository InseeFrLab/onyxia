
import { createObjectThatThrowsIfAccessed } from "../utils/createObjectThatThrowsIfAccessed";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk } from "../setup";
import { join as pathJoin } from "path";
import { Id } from "evt/tools/typeSafety/id";
import { objectKeys } from "evt/tools/typeSafety/objectKeys";
import { parseOidcAccessToken } from "../ports/KeycloakClient";
import { assert } from "evt/tools/typeSafety/assert";

type UserProfileInVault = Id<Record<string, string | number | null>, {
    userServicePassword: string;
    kaggleApiToken: string | null;
    gitName: string;
    gitEmail: string;
    gitCredentialCacheDuration: number;
}>;


export type UserProfileInVaultState = {
    [K in keyof UserProfileInVault]: {
        value: UserProfileInVault[K];
        isBeingChanged: boolean;
    };
};

export type ChangeValueParams<K extends keyof UserProfileInVault = keyof UserProfileInVault> = {
    key: K;
    value: UserProfileInVault[K];
};

export const name = "userProfileInVault";

const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<UserProfileInVaultState>(
        "The user profile should have been initialized during the store initialization"
    ),
    "reducers": {
        "initializationCompleted": (...[, { payload }]: [any, PayloadAction<{ userProfile: UserProfileInVault; }>]) => {

            const { userProfile } = payload;

            return Object.fromEntries(
                Object.entries(userProfile)
                    .map(([key, value]) => [key, { value, "isBeingChanged": false }])
            ) as any;

        },
        "changeStarted": (state, { payload }: PayloadAction<ChangeValueParams>) => {

            const wrap = state[payload.key];

            wrap.value = payload.value;
            wrap.isBeingChanged = true;

        },
        "changeCompleted": (state, { payload }: PayloadAction<{ key: keyof UserProfileInVault; }>) => {
            state[payload.key].isBeingChanged = false;
        }
    }
});

export { reducer };

export const getProfileKeyPathFactory = (params: { idep: string; }) => {

    const { idep } = params;

    const getProfileKeyPath = (params: { key: keyof UserProfileInVault; }) => {

        const { key } = params;

        return pathJoin(idep, ".onyxia", key);

    };

    return { getProfileKeyPath };

}

const generatePassword = () => Array(2).fill("").map(()=> Math.random().toString(36).slice(-10)).join("");

export const privateThunks = {
    "initialize":
        (): AppThunk => async (...args) => {

            const [dispatch, , { vaultClient, keycloakClient }] = args;

            assert(keycloakClient.isUserLoggedIn);

            const { idep, email } = await parseOidcAccessToken(keycloakClient);

            const { getProfileKeyPath } = getProfileKeyPathFactory({ idep });

            const userProfileInVault: UserProfileInVault = {
                "userServicePassword": generatePassword(),
                "kaggleApiToken": null,
                "gitName": idep,
                "gitEmail": email,
                "gitCredentialCacheDuration": 0
            };

            for (const key of objectKeys(userProfileInVault)) {

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
                        "secret": { "value": userProfileInVault[key] }
                    });

                    continue;

                }

                Object.assign(userProfileInVault, { [key]: secretWithMetadata.secret["value"] });

            }

            dispatch(actions.initializationCompleted({ userProfile: userProfileInVault }));

        },
};

export const thunks = {
    "changeValue":
        (params: ChangeValueParams): AppThunk => async (...args) => {

            const [dispatch,, { vaultClient, keycloakClient }] = args;

            assert(keycloakClient.isUserLoggedIn);

            const { idep } = await parseOidcAccessToken(keycloakClient);

            dispatch(actions.changeStarted(params));

            const { getProfileKeyPath } = getProfileKeyPathFactory({ idep });

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
