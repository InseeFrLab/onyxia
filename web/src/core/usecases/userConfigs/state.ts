import type { Id } from "tsafe";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";

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
