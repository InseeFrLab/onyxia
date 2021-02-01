import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk } from "../setup";
import { join as pathJoin } from "path";
import { Id } from "evt/tools/typeSafety/id";
import { objectKeys } from "evt/tools/typeSafety/objectKeys";
import { parseOidcAccessToken } from "../ports/OidcClient";
import { assert } from "evt/tools/typeSafety/assert";
import { createObjectThatThrowsIfAccessedFactory, isPropertyAccessedByReduxOrStorybook } from "../tools/createObjectThatThrowsIfAccessed";
import "minimal-polyfills/Object.fromEntries";

/*
 * Values of the user profile that can be changed.
 * Those value are persisted in the secret manager 
 * (That is currently vault) 
 */

const { createObjectThatThrowsIfAccessed } = createObjectThatThrowsIfAccessedFactory(
    { "isPropertyWhitelisted": isPropertyAccessedByReduxOrStorybook }
);

export type UserConfigs = Id<Record<string, string | boolean | number | null>, {
    userServicePassword: string;
    kaggleApiToken: string | null;
    gitName: string;
    gitEmail: string;
    gitCredentialCacheDuration: number;
    isBetaModeEnabled: boolean;
    isDarkModeEnabled: boolean;
    deploymentRegionId: string | null;
}>;

export type UserConfigsState = {
    [K in keyof UserConfigs]: {
        value: UserConfigs[K];
        isBeingChanged: boolean;
    };
};

export const name = "userConfigs";

const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<UserConfigsState>({
        "debugMessage": "The userConfigState should have been initialized during the store initialization"
    }),
    "reducers": {
        "initializationCompleted": (...[, { payload }]: [any, PayloadAction<{ userProfile: UserConfigs; }>]) => {

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
        "changeCompleted": (state, { payload }: PayloadAction<{ key: keyof UserConfigs; }>) => {
            state[payload.key].isBeingChanged = false;
        }
    }
});

export { reducer };


export type ChangeValueParams<K extends keyof UserConfigs = keyof UserConfigs> = {
    key: K;
    value: UserConfigs[K];
};

export const thunks = {
    "changeValue":
        <K extends keyof UserConfigs>(params: ChangeValueParams<K>): AppThunk => async (...args) => {

            const [dispatch, , { secretsManagerClient, oidcClient }] = args;

            assert(oidcClient.isUserLoggedIn);

            const { idep } = await parseOidcAccessToken(oidcClient);

            dispatch(actions.changeStarted(params));

            const { getConfigKeyPath: getProfileKeyPath } = getConfigKeyPathFactory({ idep });

            await secretsManagerClient.put({
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

export const privateThunks = {
    "initialize":
        (params: { isColorSchemeDarkEnabledByDefalut: boolean; }): AppThunk => async (...args) => {

            const { isColorSchemeDarkEnabledByDefalut } = params;

            const [dispatch, , { secretsManagerClient, oidcClient }] = args;

            assert(oidcClient.isUserLoggedIn);

            const { idep, email } = await parseOidcAccessToken(oidcClient);

            const { getConfigKeyPath } = getConfigKeyPathFactory({ idep });

            //Default values
            const userConfigs: UserConfigs = {
                "userServicePassword": generatePassword(),
                "kaggleApiToken": null,
                "gitName": idep,
                "gitEmail": email,
                "gitCredentialCacheDuration": 0,
                "isBetaModeEnabled": false,
                "isDarkModeEnabled": isColorSchemeDarkEnabledByDefalut,
                "deploymentRegionId": null
            };

            await Promise.all(
                objectKeys(userConfigs).map(
                    async key => {

                        const path = getConfigKeyPath({ key });

                        const secretWithMetadata = await secretsManagerClient.get({
                            path
                        }).catch(() => undefined);

                        if (
                            !secretWithMetadata ||
                            !("value" in secretWithMetadata.secret)
                        ) {

                            await secretsManagerClient.put({
                                path,
                                "secret": { "value": userConfigs[key] }
                            });

                            return;

                        }

                        Object.assign(
                            userConfigs, 
                            { [key]: secretWithMetadata.secret["value"] }
                        );

                    }
                )
            );

            dispatch(actions.initializationCompleted({ userProfile: userConfigs }));

        }
};

const generatePassword = () => Array(2).fill("").map(() => Math.random().toString(36).slice(-10)).join("");

const getConfigKeyPathFactory = (params: { idep: string; }) => {

    const { idep } = params;

    const getConfigKeyPath = (params: { key: keyof UserConfigs; }) => {

        const { key } = params;

        return pathJoin(idep, ".onyxia", key);

    };

    return { getConfigKeyPath };

}

export function userConfigsStateToUserConfigs(state: UserConfigsState): UserConfigs {

    const userProfileInVault: any = {};

    objectKeys(state).forEach(key => userProfileInVault[key] = state[key].value);

    return userProfileInVault;

}

