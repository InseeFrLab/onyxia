import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ThunkAction } from "../setup";
import { Id } from "tsafe/id";
import { objectKeys } from "tsafe/objectKeys";
import { assert } from "tsafe/assert";
import {
    createObjectThatThrowsIfAccessedFactory,
    isPropertyAccessedByReduxOrStorybook,
} from "../tools/createObjectThatThrowsIfAccessed";
import "minimal-polyfills/Object.fromEntries";
import { thunks as userAuthenticationThunks } from "./userAuthentication";
import type { RootState } from "../setup";
import { join as pathJoin } from "path";

/*
 * Values of the user profile that can be changed.
 * Those value are persisted in the secret manager
 * (That is currently vault)
 */

const { createObjectThatThrowsIfAccessed } = createObjectThatThrowsIfAccessedFactory({
    "isPropertyWhitelisted": isPropertyAccessedByReduxOrStorybook,
});

export type UserConfigs = Id<
    Record<string, string | boolean | number | null>,
    {
        kaggleApiToken: string | null;
        gitName: string;
        gitEmail: string;
        gitCredentialCacheDuration: number;
        isBetaModeEnabled: boolean;
        isDevModeEnabled: boolean;
        isDarkModeEnabled: boolean;
        githubPersonalAccessToken: string | null;
        doDisplayMySecretsUseInServiceDialog: boolean;
        bookmarkedServiceConfigurationStr: string | null;
        selectedProjectId: string | null;
    }
>;

export type UserConfigsState = {
    [K in keyof UserConfigs]: {
        value: UserConfigs[K];
        isBeingChanged: boolean;
    };
};

export const name = "userConfigs";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<UserConfigsState>({
        "debugMessage":
            "The userConfigState should have been initialized during the store initialization",
    }),
    "reducers": {
        "initializationCompleted": (
            ...[, { payload }]: [any, PayloadAction<{ userConfigs: UserConfigs }>]
        ) => {
            const { userConfigs } = payload;

            return Object.fromEntries(
                Object.entries(userConfigs).map(([key, value]) => [
                    key,
                    { value, "isBeingChanged": false },
                ]),
            ) as any;
        },
        "changeStarted": (state, { payload }: PayloadAction<ChangeValueParams>) => {
            const wrap = state[payload.key];

            wrap.value = payload.value;
            wrap.isBeingChanged = true;
        },
        "changeCompleted": (
            state,
            { payload }: PayloadAction<{ key: keyof UserConfigs }>,
        ) => {
            state[payload.key].isBeingChanged = false;
        },
    },
});

export type ChangeValueParams<K extends keyof UserConfigs = keyof UserConfigs> = {
    key: K;
    value: UserConfigs[K];
};

export const thunks = {
    "changeValue":
        <K extends keyof UserConfigs>(params: ChangeValueParams<K>): ThunkAction =>
        async (...args) => {
            const [dispatch, getState, { secretsManagerClient, oidcClient }] = args;

            assert(oidcClient.isUserLoggedIn);

            if (getState().userConfigs[params.key].value === params.value) {
                return;
            }

            dispatch(actions.changeStarted(params));

            const dirPath = await dispatch(privateThunks.getDirPath());

            await secretsManagerClient.put({
                "path": pathJoin(dirPath, params.key),
                "secret": { "value": params.value },
            });

            dispatch(actions.changeCompleted(params));
        },
    "resetHelperDialogs": (): ThunkAction => dispatch =>
        dispatch(
            thunks.changeValue({
                "key": "doDisplayMySecretsUseInServiceDialog",
                "value": true,
            }),
        ),
};

export const privateThunks = {
    "initialize":
        (): ThunkAction =>
        async (...args) => {
            const [
                dispatch,
                ,
                {
                    secretsManagerClient,
                    oidcClient,
                    createStoreParams: {
                        getIsDarkModeEnabledValueForProfileInitialization,
                    },
                },
            ] = args;

            assert(oidcClient.isUserLoggedIn);

            const { username, email } = dispatch(userAuthenticationThunks.getUser());
            //Default values
            const userConfigs: UserConfigs = {
                "kaggleApiToken": null,
                "gitName": username,
                "gitEmail": email,
                "gitCredentialCacheDuration": 0,
                "isBetaModeEnabled": false,
                "isDevModeEnabled": false,
                "isDarkModeEnabled": getIsDarkModeEnabledValueForProfileInitialization(),
                "githubPersonalAccessToken": null,
                "doDisplayMySecretsUseInServiceDialog": true,
                "bookmarkedServiceConfigurationStr": null,
                "selectedProjectId": null,
            };

            const dirPath = await dispatch(privateThunks.getDirPath());

            await Promise.all(
                objectKeys(userConfigs).map(async key => {
                    const path = pathJoin(dirPath, key);

                    const value = await secretsManagerClient
                        .get({ path })
                        .then(({ secret }) => secret["value"])
                        .catch(() => undefined);

                    if (value === undefined) {
                        //Store default value.
                        await secretsManagerClient.put({
                            path,
                            "secret": { "value": userConfigs[key] },
                        });

                        return;
                    }

                    Object.assign(userConfigs, { [key]: value });
                }),
            );

            dispatch(actions.initializationCompleted({ userConfigs }));
        },
    "getDirPath":
        (): ThunkAction<Promise<string>> =>
        async (...args) => {
            const [, , { onyxiaApiClient }] = args;

            //We can't use the slice project selection yet because the slice userConfig
            //is initialized first.
            const { vaultTopDir } = (await onyxiaApiClient.getUserProjects())[0];

            return pathJoin("/", vaultTopDir, hiddenDirectoryBasename);
        },
};

export const selectors = (() => {
    /** Give the value directly (without isBeingChanged) */
    const userConfigs = (rootState: RootState): UserConfigs => {
        const userConfigs: any = {};

        const state = rootState.userConfigs;

        objectKeys(state).forEach(key => (userConfigs[key] = state[key].value));

        return userConfigs;
    };

    return { userConfigs };
})();

export const hiddenDirectoryBasename = ".onyxia";
