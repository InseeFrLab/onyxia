import "minimal-polyfills/Object.fromEntries";
import type { Thunks } from "core/bootstrap";
import { objectKeys } from "tsafe/objectKeys";
import { assert } from "tsafe/assert";
import * as userAuthentication from "../userAuthentication";
import { join as pathJoin } from "pathe";
import { getIsDarkModeEnabledOsDefault } from "onyxia-ui/tools/getIsDarkModeEnabledOsDefault";
import { name, actions, type ChangeValueParams, type UserConfigs } from "./state";

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
