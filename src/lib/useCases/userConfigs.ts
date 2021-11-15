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
import { createGetPathFactory } from "./projectConfigs";

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
        isDarkModeEnabled: boolean;
        deploymentRegionId: string | null;
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

const { reducer, actions } = createSlice({
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

export { reducer };

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

            const { username } = dispatch(userAuthenticationThunks.getUser());

            dispatch(actions.changeStarted(params));

            const { getPath } = getPathFactory({ "projectId": username });

            await secretsManagerClient.put({
                "path": getPath({ "key": params.key }),
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

            const { getPath } = getPathFactory({ "projectId": username });

            //Default values
            const userConfigs: UserConfigs = {
                "kaggleApiToken": null,
                "gitName": username,
                "gitEmail": email,
                "gitCredentialCacheDuration": 0,
                "isBetaModeEnabled": false,
                "isDarkModeEnabled": getIsDarkModeEnabledValueForProfileInitialization(),
                "deploymentRegionId": null,
                "githubPersonalAccessToken": null,
                "doDisplayMySecretsUseInServiceDialog": true,
                "bookmarkedServiceConfigurationStr": null,
                "selectedProjectId": null,
            };

            await Promise.all(
                objectKeys(userConfigs).map(async key => {
                    const path = getPath({ key });

                    const isLegacyValue = (value: unknown) => {
                        switch (key) {
                            case "deploymentRegionId":
                                return value === null;
                        }
                        return false;
                    };

                    const value = await secretsManagerClient
                        .get({ path })
                        .then(({ secret }) => secret["value"])
                        .catch(() => undefined);

                    if (value === undefined || isLegacyValue(value)) {
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

const { getPathFactory } = createGetPathFactory<keyof UserConfigs>();
