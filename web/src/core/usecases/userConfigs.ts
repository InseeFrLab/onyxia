import "minimal-polyfills/Object.fromEntries";
import type { Thunks, State as RootState } from "core/bootstrap";
import type { Id } from "tsafe";
import { objectKeys } from "tsafe/objectKeys";
import { assert } from "tsafe/assert";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed,
    createSelector
} from "clean-architecture";
import * as userAuthentication from "./userAuthentication";
import { join as pathJoin } from "pathe";
import { getIsDarkModeEnabledOsDefault } from "onyxia-ui/tools/getIsDarkModeEnabledOsDefault";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";

/*
 * Values of the user profile that can be changed.
 * Those value are persisted in the secret manager
 * (That is currently vault)
 */

export type UserConfigs = Id<
    Record<string, string | boolean | number | null>,
    {
        gitName: string;
        gitEmail: string;
        gitCredentialCacheDuration: number;
        isBetaModeEnabled: boolean;
        isDevModeEnabled: boolean;
        isDarkModeEnabled: boolean;
        githubPersonalAccessToken: string | null;
        doDisplayMySecretsUseInServiceDialog: boolean;
        doDisplayAcknowledgeConfigVolatilityDialogIfNoVault: boolean;
        selectedProjectId: string | null;
        isCommandBarEnabled: boolean;
    }
>;

export type State = {
    [K in keyof UserConfigs]: {
        value: UserConfigs[K];
        isBeingChanged: boolean;
    };
};

export const name = "userConfigs";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>({
        debugMessage:
            "The userConfigState should have been initialized during the store initialization"
    }),
    reducers: {
        initializationCompleted: (
            ...[, { payload }]: [any, { payload: { userConfigs: UserConfigs } }]
        ) => {
            const { userConfigs } = payload;

            return Object.fromEntries(
                Object.entries(userConfigs).map(([key, value]) => [
                    key,
                    { value, isBeingChanged: false }
                ])
            ) as any;
        },
        changeStarted: (state, { payload }: { payload: ChangeValueParams }) => {
            const wrap = state[payload.key];

            wrap.value = payload.value;
            wrap.isBeingChanged = true;
        },
        changeCompleted: (
            state,
            { payload }: { payload: { key: keyof UserConfigs } }
        ) => {
            state[payload.key].isBeingChanged = false;
        }
    }
});

export type ChangeValueParams<K extends keyof UserConfigs = keyof UserConfigs> = {
    key: K;
    value: UserConfigs[K];
};

export const thunks = {
    changeValue:
        <K extends keyof UserConfigs>(params: ChangeValueParams<K>) =>
        async (...args) => {
            const [dispatch, getState, { secretsManager, oidc }] = args;

            assert(oidc.isUserLoggedIn);

            if (getState()[name][params.key].value === params.value) {
                return;
            }

            dispatch(actions.changeStarted(params));

            const dirPath = await dispatch(privateThunks.getDirPath());

            await secretsManager.put({
                path: pathJoin(dirPath, params.key),
                secret: { value: params.value }
            });

            dispatch(actions.changeCompleted(params));
        },
    resetHelperDialogs:
        () =>
        (...args) => {
            const [dispatch] = args;

            dispatch(
                thunks.changeValue({
                    key: "doDisplayMySecretsUseInServiceDialog",
                    value: true
                })
            );

            dispatch(
                thunks.changeValue({
                    key: "doDisplayAcknowledgeConfigVolatilityDialogIfNoVault",
                    value: true
                })
            );
        }
} satisfies Thunks;

export const protectedThunks = {
    initialize:
        () =>
        async (...args) => {
            /* prettier-ignore */
            const [dispatch, getState, { secretsManager, paramsOfBootstrapCore }] = args;

            const { isUserLoggedIn, user } =
                userAuthentication.selectors.main(getState());

            assert(isUserLoggedIn);

            const { username, email } = user;

            // NOTE: Default values
            const userConfigs: UserConfigs = {
                gitName: username,
                gitEmail: email,
                gitCredentialCacheDuration: 0,
                isBetaModeEnabled: false,
                isDevModeEnabled: false,
                isDarkModeEnabled: getIsDarkModeEnabledOsDefault(),
                githubPersonalAccessToken: null,
                doDisplayMySecretsUseInServiceDialog: true,
                doDisplayAcknowledgeConfigVolatilityDialogIfNoVault: true,
                selectedProjectId: null,
                isCommandBarEnabled: paramsOfBootstrapCore.isCommandBarEnabledByDefault
            };

            const dirPath = await dispatch(privateThunks.getDirPath());

            await Promise.all(
                objectKeys(userConfigs).map(async key => {
                    const path = pathJoin(dirPath, key);

                    const value = await secretsManager
                        .get({ path })
                        .then(({ secret }) => secret["value"])
                        .catch(() => undefined);

                    if (value === undefined) {
                        //Store default value.
                        await secretsManager.put({
                            path,
                            secret: { value: userConfigs[key] }
                        });

                        return;
                    }

                    Object.assign(userConfigs, { [key]: value });
                })
            );

            dispatch(actions.initializationCompleted({ userConfigs }));
        }
} satisfies Thunks;

const privateThunks = {
    getDirPath:
        () =>
        async (...args): Promise<string> => {
            const [, , { onyxiaApi }] = args;

            const userProject = (await onyxiaApi.getUserAndProjects()).projects.find(
                project => project.group === undefined
            );

            assert(userProject !== undefined);

            return pathJoin("/", userProject.vaultTopDir, ".onyxia");
        }
} satisfies Thunks;

export const selectors = (() => {
    const state = (rootState: RootState): State => rootState[name];

    const userConfigs = createSelector(state, state => {
        const userConfigs: any = {};

        objectKeys(state).forEach(key => (userConfigs[key] = state[key].value));

        return userConfigs as UserConfigs;
    });

    // NOTE: This will not crash even if the user is not logged in.
    const isDarkModeEnabled = (rootState: RootState): boolean | undefined => {
        const { isUserLoggedIn } = userAuthentication.selectors.main(rootState);

        if (!isUserLoggedIn) {
            return undefined;
        }

        return userConfigs(rootState).isDarkModeEnabled;
    };

    const isVaultEnabled = createSelector(
        deploymentRegionManagement.selectors.currentDeploymentRegion,
        deploymentRegion => deploymentRegion.vault !== undefined
    );

    return {
        userConfigs,
        userConfigsWithUpdateProgress: state,
        isDarkModeEnabled,
        isVaultEnabled
    };
})();
